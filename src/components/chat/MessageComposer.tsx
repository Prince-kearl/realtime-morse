import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Settings2, Radio, Mic, Keyboard, Type, Square } from 'lucide-react';
import type { InputSelection } from '@/components/InputSourceDialog';
import { decodeMorse } from '@/lib/morse';
import { textToMorse, playMorse } from '@/lib/morseEncoder';
import { toast } from 'sonner';

interface Props {
  selection: InputSelection;
  onChangeInput: () => void;
  onSend: (morse: string, decoded: string, source: string) => Promise<void>;
}

const ICONS = {
  telegraph: Radio,
  microphone: Mic,
  keyboard: Keyboard,
  text: Type,
} as const;

const DOT_THRESHOLD = 200;
const LETTER_GAP = 600;
const WORD_GAP = 1400;

export function MessageComposer({ selection, onChangeInput, onSend }: Props) {
  const [text, setText] = useState('');
  const [morseBuffer, setMorseBuffer] = useState(''); // accumulated morse e.g. ".-. .. ..."
  const [currentLetter, setCurrentLetter] = useState('');
  const [pressing, setPressing] = useState(false);
  const [decodedPreview, setDecodedPreview] = useState('');

  const pressStartRef = useRef<number>(0);
  const letterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wordTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<{ osc: OscillatorNode; gain: GainNode } | null>(null);

  const currentLetterRef = useRef('');
  const morseBufferRef = useRef('');

  useEffect(() => { currentLetterRef.current = currentLetter; }, [currentLetter]);
  useEffect(() => { morseBufferRef.current = morseBuffer; }, [morseBuffer]);

  // Decoded preview
  useEffect(() => {
    const tokens = morseBuffer.split(' ').filter(Boolean);
    const decoded = tokens.map(t => (t === '/' ? ' ' : decodeMorse(t))).join('');
    setDecodedPreview(decoded);
  }, [morseBuffer]);

  const playBeep = (on: boolean) => {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    const ctx = audioCtxRef.current;
    if (on) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 600;
      gain.gain.value = 0.2;
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      oscRef.current = { osc, gain };
    } else if (oscRef.current) {
      oscRef.current.gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
      oscRef.current.osc.stop(ctx.currentTime + 0.05);
      oscRef.current = null;
    }
  };

  const flushLetter = useCallback(() => {
    if (currentLetterRef.current) {
      setMorseBuffer(b => (b ? b + ' ' : '') + currentLetterRef.current);
      setCurrentLetter('');
    }
  }, []);

  const flushWord = useCallback(() => {
    flushLetter();
    setMorseBuffer(b => (b && !b.endsWith('/') ? b + ' /' : b));
  }, [flushLetter]);

  const handlePressStart = useCallback(() => {
    if (pressing) return;
    if (letterTimerRef.current) clearTimeout(letterTimerRef.current);
    if (wordTimerRef.current) clearTimeout(wordTimerRef.current);
    pressStartRef.current = performance.now();
    setPressing(true);
    playBeep(true);
  }, [pressing]);

  const handlePressEnd = useCallback(() => {
    if (!pressing) return;
    const dur = performance.now() - pressStartRef.current;
    setPressing(false);
    playBeep(false);
    const symbol = dur < DOT_THRESHOLD ? '.' : '-';
    setCurrentLetter(c => c + symbol);
    letterTimerRef.current = setTimeout(flushLetter, LETTER_GAP);
    wordTimerRef.current = setTimeout(flushWord, WORD_GAP);
  }, [pressing, flushLetter, flushWord]);

  // Spacebar binding (telegraph + keyboard share the same tap mechanic;
  // keyboard also accepts typed letters that auto-encode)
  useEffect(() => {
    if (selection.source !== 'telegraph' && selection.source !== 'keyboard') return;
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        handlePressStart();
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handlePressEnd();
      }
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [selection.source, handlePressStart, handlePressEnd]);

  // Microphone tone decoding
  useEffect(() => {
    if (selection.source !== 'microphone') return;
    let ctx: AudioContext | null = null;
    let stream: MediaStream | null = null;
    let raf = 0;
    let toneOn = false;
    let toneStart = 0;
    let lastOff = performance.now();
    const TARGET = 600;
    const VOL_THRESH = 0.04;
    let letterTimer: ReturnType<typeof setTimeout> | null = null;
    let wordTimer: ReturnType<typeof setTimeout> | null = null;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: selection.audioDeviceId ? { exact: selection.audioDeviceId } : undefined },
        });
        ctx = new AudioContext();
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        src.connect(analyser);
        const buf = new Float32Array(analyser.fftSize);

        const flushL = () => {
          if (currentLetterRef.current) {
            setMorseBuffer(b => (b ? b + ' ' : '') + currentLetterRef.current);
            setCurrentLetter('');
          }
        };
        const flushW = () => {
          flushL();
          setMorseBuffer(b => (b && !b.endsWith('/') ? b + ' /' : b));
        };

        const tick = () => {
          analyser.getFloatTimeDomainData(buf);
          // Goertzel
          const N = buf.length;
          const k = Math.round((N * TARGET) / ctx!.sampleRate);
          const w = (2 * Math.PI * k) / N;
          const cosw = Math.cos(w);
          const coeff = 2 * cosw;
          let s0 = 0, s1 = 0, s2 = 0;
          for (let i = 0; i < N; i++) {
            s0 = buf[i] + coeff * s1 - s2;
            s2 = s1; s1 = s0;
          }
          const power = Math.sqrt(s1 * s1 + s2 * s2 - coeff * s1 * s2) / (N / 2);
          const now = performance.now();
          const detected = power > VOL_THRESH;
          if (detected && !toneOn) {
            toneOn = true;
            toneStart = now;
            if (letterTimer) clearTimeout(letterTimer);
            if (wordTimer) clearTimeout(wordTimer);
          } else if (!detected && toneOn) {
            toneOn = false;
            const dur = now - toneStart;
            const sym = dur < DOT_THRESHOLD ? '.' : '-';
            setCurrentLetter(c => c + sym);
            lastOff = now;
            letterTimer = setTimeout(flushL, LETTER_GAP);
            wordTimer = setTimeout(flushW, WORD_GAP);
          }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      } catch (err) {
        toast.error('Could not access microphone');
      }
    })();

    return () => {
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach(t => t.stop());
      ctx?.close();
      if (letterTimer) clearTimeout(letterTimer);
      if (wordTimer) clearTimeout(wordTimer);
    };
  }, [selection.source, selection.audioDeviceId]);

  const clearAll = () => {
    setMorseBuffer('');
    setCurrentLetter('');
    setText('');
  };

  const handleSend = async () => {
    let morse = '';
    let decoded = '';
    if (selection.source === 'text') {
      if (!text.trim()) return;
      decoded = text.trim();
      morse = textToMorse(decoded);
    } else {
      // flush any pending letter into buffer
      const pending = currentLetterRef.current;
      const finalMorse = (morseBuffer + (pending ? (morseBuffer ? ' ' : '') + pending : '')).trim();
      if (!finalMorse) return;
      morse = finalMorse;
      decoded = finalMorse
        .split(' ')
        .filter(Boolean)
        .map(t => (t === '/' ? ' ' : decodeMorse(t)))
        .join('');
    }
    await onSend(morse, decoded, selection.source);
    clearAll();
  };

  const Icon = ICONS[selection.source];

  return (
    <div className="rounded-3xl bg-white border border-border p-3 space-y-2 shadow-card">
      <div className="flex items-center justify-between px-1">
        <button
          onClick={onChangeInput}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <Icon className="h-3.5 w-3.5" />
          <span className="uppercase tracking-wider font-semibold">{selection.source}</span>
          <Settings2 className="h-3 w-3" />
        </button>
        {(morseBuffer || currentLetter) && selection.source !== 'text' && (
          <button onClick={clearAll} className="text-xs text-muted-foreground hover:text-destructive">Clear</button>
        )}
      </div>

      {selection.source === 'text' ? (
        <div className="flex items-center gap-2">
          <Input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Type your message…"
            className="flex-1 h-12 rounded-full bg-secondary border-0 px-5 text-[15px]"
          />
          <Button
            onClick={handleSend}
            disabled={!text.trim()}
            className="h-12 w-12 rounded-full bg-gradient-sent text-white hover:opacity-90 shadow-card p-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <>
          <div className="rounded-2xl bg-secondary p-3 min-h-[48px] flex items-center justify-between gap-2">
            <div className="flex-1 font-mono text-sm break-all">
              {morseBuffer}
              {currentLetter && <span className="text-primary ml-1">{currentLetter}</span>}
              {!morseBuffer && !currentLetter && (
                <span className="text-muted-foreground text-xs italic">
                  {selection.source === 'microphone' ? 'Listening for tone at 600 Hz…' : 'Tap the key or hold spacebar to begin'}
                </span>
              )}
            </div>
            {decodedPreview && (
              <div className="text-xs text-muted-foreground whitespace-nowrap">
                → <span className="text-foreground font-mono">{decodedPreview}</span>
              </div>
            )}
          </div>

          {selection.source === 'telegraph' && (
            <button
              onMouseDown={handlePressStart}
              onMouseUp={handlePressEnd}
              onMouseLeave={() => pressing && handlePressEnd()}
              onTouchStart={(e) => { e.preventDefault(); handlePressStart(); }}
              onTouchEnd={(e) => { e.preventDefault(); handlePressEnd(); }}
              className={`w-full h-14 rounded-2xl font-bold uppercase tracking-widest text-sm transition-all select-none ${
                pressing
                  ? 'bg-gradient-sent text-white shadow-soft scale-[0.99]'
                  : 'bg-secondary text-primary hover:bg-secondary/70'
              }`}
            >
              {pressing ? '● Sending' : 'Tap / Hold to Key'}
            </button>
          )}

          <Button
            onClick={handleSend}
            disabled={!morseBuffer && !currentLetter}
            className="w-full h-12 rounded-full bg-gradient-sent text-white hover:opacity-90 shadow-card"
          >
            <Send className="h-4 w-4 mr-2" /> Send
          </Button>
        </>
      )}
    </div>
  );
}
