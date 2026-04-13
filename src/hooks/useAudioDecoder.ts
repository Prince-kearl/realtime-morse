import { useState, useRef, useCallback, useEffect } from 'react';
import { decodeMorse } from '@/lib/morse';

interface AudioDecoderState {
  isListening: boolean;
  currentSignals: string;
  rawSequence: string;
  decodedText: string;
  volume: number;
  toneDetected: boolean;
}

export function useAudioDecoder(settings: {
  dotThreshold: number;
  letterGap: number;
  wordGap: number;
  targetFrequency: number;
  volumeThreshold: number;
}) {
  const [state, setState] = useState<AudioDecoderState>({
    isListening: false,
    currentSignals: '',
    rawSequence: '',
    decodedText: '',
    volume: 0,
    toneDetected: false,
  });

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);

  const toneStartRef = useRef<number>(0);
  const toneActiveRef = useRef(false);
  const lastToneEndRef = useRef<number>(0);
  const currentSignalsRef = useRef('');
  const rawSequenceRef = useRef('');
  const decodedTextRef = useRef('');

  const letterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wordTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const flushLetter = useCallback(() => {
    const signals = currentSignalsRef.current;
    if (!signals) return;
    const char = decodeMorse(signals);
    decodedTextRef.current += char;
    currentSignalsRef.current = '';
    setState(s => ({ ...s, decodedText: decodedTextRef.current, currentSignals: '' }));
  }, []);

  const flushWord = useCallback(() => {
    flushLetter();
    if (decodedTextRef.current && !decodedTextRef.current.endsWith(' ')) {
      decodedTextRef.current += ' ';
      setState(s => ({ ...s, decodedText: decodedTextRef.current }));
    }
  }, [flushLetter]);

  const processSignal = useCallback((signal: string) => {
    currentSignalsRef.current += signal;
    rawSequenceRef.current += signal;
    setState(s => ({
      ...s,
      currentSignals: currentSignalsRef.current,
      rawSequence: rawSequenceRef.current,
    }));

    if (letterTimerRef.current) clearTimeout(letterTimerRef.current);
    if (wordTimerRef.current) clearTimeout(wordTimerRef.current);

    letterTimerRef.current = setTimeout(flushLetter, settingsRef.current.letterGap);
    wordTimerRef.current = setTimeout(flushWord, settingsRef.current.wordGap);
  }, [flushLetter, flushWord]);

  // Goertzel algorithm for single-frequency detection
  const detectTone = useCallback((analyser: AnalyserNode, sampleRate: number): { isTone: boolean; magnitude: number } => {
    const bufferLength = analyser.fftSize;
    const data = new Float32Array(bufferLength);
    analyser.getFloatTimeDomainData(data);

    const targetFreq = settingsRef.current.targetFrequency;
    const k = Math.round((bufferLength * targetFreq) / sampleRate);
    const w = (2 * Math.PI * k) / bufferLength;
    const cosW = Math.cos(w);

    let s0 = 0, s1 = 0, s2 = 0;
    for (let i = 0; i < bufferLength; i++) {
      s0 = data[i] + 2 * cosW * s1 - s2;
      s2 = s1;
      s1 = s0;
    }

    const power = s1 * s1 + s2 * s2 - 2 * cosW * s1 * s2;
    const magnitude = Math.sqrt(Math.abs(power)) / bufferLength;

    // Also compute overall RMS for volume meter
    let rms = 0;
    for (let i = 0; i < bufferLength; i++) {
      rms += data[i] * data[i];
    }
    rms = Math.sqrt(rms / bufferLength);

    return {
      isTone: magnitude > settingsRef.current.volumeThreshold,
      magnitude: Math.min(rms * 10, 1), // normalized volume
    };
  }, []);

  const analyze = useCallback(() => {
    if (!analyserRef.current || !audioCtxRef.current) return;

    const { isTone, magnitude } = detectTone(analyserRef.current, audioCtxRef.current.sampleRate);
    const now = performance.now();

    setState(s => ({ ...s, volume: magnitude, toneDetected: isTone }));

    if (isTone && !toneActiveRef.current) {
      // Tone started
      toneActiveRef.current = true;
      toneStartRef.current = now;
    } else if (!isTone && toneActiveRef.current) {
      // Tone ended
      toneActiveRef.current = false;
      const duration = now - toneStartRef.current;
      lastToneEndRef.current = now;

      if (duration > 20) { // debounce very short glitches
        const signal = duration < settingsRef.current.dotThreshold ? '.' : '-';
        processSignal(signal);
      }
    }

    animFrameRef.current = requestAnimationFrame(analyze);
  }, [detectTone, processSignal]);

  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;

      currentSignalsRef.current = '';
      rawSequenceRef.current = '';
      decodedTextRef.current = '';

      setState({
        isListening: true,
        currentSignals: '',
        rawSequence: '',
        decodedText: '',
        volume: 0,
        toneDetected: false,
      });

      animFrameRef.current = requestAnimationFrame(analyze);
    } catch (err) {
      console.error('Microphone access denied:', err);
    }
  }, [analyze]);

  const stopListening = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    if (letterTimerRef.current) clearTimeout(letterTimerRef.current);
    if (wordTimerRef.current) clearTimeout(wordTimerRef.current);

    // Flush any remaining signals
    if (currentSignalsRef.current) flushLetter();

    streamRef.current?.getTracks().forEach(t => t.stop());
    audioCtxRef.current?.close();
    streamRef.current = null;
    audioCtxRef.current = null;
    analyserRef.current = null;

    setState(s => ({ ...s, isListening: false, volume: 0, toneDetected: false }));
  }, [flushLetter]);

  const reset = useCallback(() => {
    currentSignalsRef.current = '';
    rawSequenceRef.current = '';
    decodedTextRef.current = '';
    setState(s => ({ ...s, currentSignals: '', rawSequence: '', decodedText: '' }));
  }, []);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      if (letterTimerRef.current) clearTimeout(letterTimerRef.current);
      if (wordTimerRef.current) clearTimeout(wordTimerRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      audioCtxRef.current?.close();
    };
  }, []);

  return { ...state, startListening, stopListening, reset };
}
