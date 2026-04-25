import { CHAR_TO_MORSE } from './morse';

export function textToMorse(text: string): string {
  return text
    .toUpperCase()
    .split('')
    .map(c => (c === ' ' ? '/' : CHAR_TO_MORSE[c] || ''))
    .filter(Boolean)
    .join(' ');
}

/** Play a morse string ("... --- .../") through Web Audio. Returns a stop function. */
export function playMorse(
  morse: string,
  opts: { dotMs?: number; freq?: number; volume?: number } = {}
): () => void {
  const dotMs = opts.dotMs ?? 100;
  const freq = opts.freq ?? 600;
  const volume = opts.volume ?? 0.25;
  const ctx = new AudioContext();
  let cancelled = false;

  const beep = (start: number, durMs: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, ctx.currentTime + start / 1000);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + start / 1000 + 0.005);
    gain.gain.setValueAtTime(volume, ctx.currentTime + (start + durMs) / 1000 - 0.005);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + (start + durMs) / 1000);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + start / 1000);
    osc.stop(ctx.currentTime + (start + durMs) / 1000 + 0.01);
  };

  let t = 0;
  for (const token of morse.split(' ')) {
    if (token === '/') {
      t += dotMs * 7;
      continue;
    }
    for (const sym of token) {
      const dur = sym === '.' ? dotMs : dotMs * 3;
      beep(t, dur);
      t += dur + dotMs; // intra-letter gap
    }
    t += dotMs * 2; // letter gap (3x total with the trailing intra)
  }

  setTimeout(() => {
    if (!cancelled) ctx.close();
  }, t + 100);

  return () => {
    cancelled = true;
    ctx.close();
  };
}
