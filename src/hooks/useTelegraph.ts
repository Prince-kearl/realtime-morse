import { useState, useRef, useCallback, useEffect } from 'react';
import { decodeMorse } from '@/lib/morse';

export interface TelegraphSettings {
  dotThreshold: number;
  letterGap: number;
  wordGap: number;
  audioEnabled: boolean;
}

const DEFAULT_SETTINGS: TelegraphSettings = {
  dotThreshold: 200,
  letterGap: 600,
  wordGap: 1400,
  audioEnabled: true,
};

export function useTelegraph() {
  const [settings, setSettings] = useState<TelegraphSettings>(DEFAULT_SETTINGS);
  const [isPressing, setIsPressing] = useState(false);
  const [currentSignals, setCurrentSignals] = useState('');
  const [rawSequence, setRawSequence] = useState('');
  const [decodedText, setDecodedText] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [pressDuration, setPressDuration] = useState(0);

  const pressStartRef = useRef<number>(0);
  const letterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wordTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animFrameRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
      const gain = audioCtxRef.current.createGain();
      gain.gain.value = 0;
      gain.connect(audioCtxRef.current.destination);
      gainRef.current = gain;

      const osc = audioCtxRef.current.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 600;
      osc.connect(gain);
      osc.start();
      oscRef.current = osc;
    }
    return { ctx: audioCtxRef.current, gain: gainRef.current! };
  }, []);

  const startSound = useCallback(() => {
    if (!settings.audioEnabled) return;
    const { ctx, gain } = getAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    gain.gain.setTargetAtTime(0.3, ctx.currentTime, 0.01);
  }, [settings.audioEnabled, getAudioCtx]);

  const stopSound = useCallback(() => {
    if (!gainRef.current || !audioCtxRef.current) return;
    gainRef.current.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.01);
  }, []);

  const flushLetter = useCallback((signals: string) => {
    if (!signals) return;
    const char = decodeMorse(signals);
    setDecodedText(prev => prev + char);
    setCurrentSignals('');
  }, []);

  const flushWord = useCallback(() => {
    setDecodedText(prev => {
      if (prev && !prev.endsWith(' ')) return prev + ' ';
      return prev;
    });
  }, []);

  const handlePressStart = useCallback(() => {
    if (isPressing) return;
    setIsPressing(true);
    pressStartRef.current = performance.now();
    startSound();

    if (letterTimerRef.current) clearTimeout(letterTimerRef.current);
    if (wordTimerRef.current) clearTimeout(wordTimerRef.current);

    const animate = () => {
      setPressDuration(performance.now() - pressStartRef.current);
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);
  }, [isPressing, startSound]);

  const handlePressEnd = useCallback(() => {
    if (!isPressing) return;
    setIsPressing(false);
    stopSound();
    cancelAnimationFrame(animFrameRef.current);

    const duration = performance.now() - pressStartRef.current;
    const signal = duration < settings.dotThreshold ? '.' : '-';
    setPressDuration(0);

    setCurrentSignals(prev => {
      const next = prev + signal;
      // schedule letter flush
      if (letterTimerRef.current) clearTimeout(letterTimerRef.current);
      letterTimerRef.current = setTimeout(() => flushLetter(next), settings.letterGap);
      if (wordTimerRef.current) clearTimeout(wordTimerRef.current);
      wordTimerRef.current = setTimeout(() => {
        flushLetter(next);
        flushWord();
      }, settings.wordGap);
      return next;
    });

    setRawSequence(prev => prev + signal);
  }, [isPressing, settings, stopSound, flushLetter, flushWord]);

  const reset = useCallback(() => {
    if (decodedText.trim()) {
      setHistory(prev => [decodedText.trim(), ...prev].slice(0, 20));
    }
    setCurrentSignals('');
    setRawSequence('');
    setDecodedText('');
    setPressDuration(0);
    if (letterTimerRef.current) clearTimeout(letterTimerRef.current);
    if (wordTimerRef.current) clearTimeout(wordTimerRef.current);
  }, [decodedText]);

  // cleanup
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      if (letterTimerRef.current) clearTimeout(letterTimerRef.current);
      if (wordTimerRef.current) clearTimeout(wordTimerRef.current);
      oscRef.current?.stop();
      audioCtxRef.current?.close();
    };
  }, []);

  return {
    settings, setSettings,
    isPressing, pressDuration,
    currentSignals, rawSequence, decodedText,
    history,
    handlePressStart, handlePressEnd,
    reset,
  };
}
