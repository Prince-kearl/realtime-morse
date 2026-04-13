import { useState, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Play, Square, Volume2, VolumeX } from 'lucide-react';
import { CHAR_TO_MORSE } from '@/lib/morse';

function textToMorseSequence(text: string): { char: string; morse: string }[] {
  return text.toUpperCase().split('').map(c => ({
    char: c,
    morse: c === ' ' ? '/' : (CHAR_TO_MORSE[c] || ''),
  })).filter(x => x.morse !== '');
}

export function TextToMorse() {
  const [inputText, setInputText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [speed, setSpeed] = useState(150); // dot duration ms
  const [audioEnabled, setAudioEnabled] = useState(true);
  const stopRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playBeep = useCallback((durationMs: number) => {
    if (!audioEnabled) return;
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 600;
    gain.gain.value = 0.3;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
  }, [audioEnabled]);

  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

  const play = useCallback(async () => {
    const seq = textToMorseSequence(inputText);
    if (seq.length === 0) return;
    setIsPlaying(true);
    stopRef.current = false;

    for (let i = 0; i < seq.length; i++) {
      if (stopRef.current) break;
      setActiveIdx(i);
      const { morse } = seq[i];

      if (morse === '/') {
        await sleep(speed * 7);
        continue;
      }

      for (let j = 0; j < morse.length; j++) {
        if (stopRef.current) break;
        const s = morse[j];
        const dur = s === '.' ? speed : speed * 3;
        playBeep(dur);
        await sleep(dur);
        // gap between signals in a letter
        if (j < morse.length - 1) await sleep(speed);
      }
      // gap between letters
      await sleep(speed * 3);
    }

    setIsPlaying(false);
    setActiveIdx(-1);
  }, [inputText, speed, playBeep]);

  const stop = useCallback(() => {
    stopRef.current = true;
    setIsPlaying(false);
    setActiveIdx(-1);
  }, []);

  const sequence = textToMorseSequence(inputText);

  return (
    <Card className="border-telegraph-border bg-telegraph-card">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-telegraph-muted">Text → Morse Encoder</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-telegraph-muted hover:text-telegraph-accent"
            onClick={() => setAudioEnabled(!audioEnabled)}
          >
            {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
        </div>

        <Textarea
          placeholder="Type text to encode as Morse code..."
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          className="bg-telegraph-bg border-telegraph-border text-telegraph-text placeholder:text-telegraph-muted font-mono resize-none"
          rows={2}
        />

        {/* Morse output display */}
        {sequence.length > 0 && (
          <div className="rounded-md bg-telegraph-bg border border-telegraph-border p-4 flex flex-wrap gap-x-3 gap-y-2 font-mono text-sm">
            {sequence.map((item, i) => (
              <span
                key={i}
                className={`transition-colors duration-150 ${
                  item.morse === '/'
                    ? 'text-telegraph-muted mx-1'
                    : i === activeIdx
                      ? 'text-telegraph-accent font-bold scale-110'
                      : 'text-telegraph-text'
                }`}
              >
                {item.morse === '/' ? '/' : (
                  <span className="flex flex-col items-center">
                    <span className="text-[10px] text-telegraph-muted">{item.char}</span>
                    <span>{item.morse}</span>
                  </span>
                )}
              </span>
            ))}
          </div>
        )}

        {/* Speed + play controls */}
        <div className="flex items-center gap-4">
          <div className="flex-1 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-telegraph-muted">Speed</span>
              <span className="text-telegraph-accent font-mono">{speed}ms/dot</span>
            </div>
            <Slider value={[speed]} min={50} max={400} step={10} onValueChange={([v]) => setSpeed(v)} />
          </div>
          {isPlaying ? (
            <Button onClick={stop} variant="outline" size="sm" className="border-telegraph-border text-telegraph-accent hover:bg-telegraph-accent/10">
              <Square className="h-3.5 w-3.5 mr-1.5" /> Stop
            </Button>
          ) : (
            <Button onClick={play} variant="outline" size="sm" disabled={!inputText.trim()} className="border-telegraph-border text-telegraph-accent hover:bg-telegraph-accent/10">
              <Play className="h-3.5 w-3.5 mr-1.5" /> Play
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
