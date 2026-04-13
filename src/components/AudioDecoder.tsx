import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Copy, Check, Mic, MicOff, RotateCcw } from 'lucide-react';
import { useAudioDecoder } from '@/hooks/useAudioDecoder';

export function AudioDecoder() {
  const [targetFrequency, setTargetFrequency] = useState(600);
  const [volumeThreshold, setVolumeThreshold] = useState(0.05);
  const [dotThreshold, setDotThreshold] = useState(200);
  const [letterGap, setLetterGap] = useState(600);
  const [wordGap, setWordGap] = useState(1400);
  const [copied, setCopied] = useState(false);

  const decoder = useAudioDecoder({
    dotThreshold,
    letterGap,
    wordGap,
    targetFrequency,
    volumeThreshold,
  });

  const handleCopy = () => {
    if (!decoder.decodedText) return;
    navigator.clipboard.writeText(decoder.decodedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Card className="border-telegraph-border bg-telegraph-card">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-telegraph-muted">
            🎤 Audio Morse Decoder
          </h2>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={decoder.reset}
              className="h-8 w-8 text-telegraph-muted hover:text-telegraph-accent"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopy}
              disabled={!decoder.decodedText}
              className="h-8 w-8 text-telegraph-muted hover:text-telegraph-accent"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <p className="text-xs text-telegraph-muted">
          Listen to Morse code audio through your microphone and decode it in real time. Works with any tone-based Morse signal.
        </p>

        {/* Listen button */}
        <div className="flex items-center gap-4">
          {decoder.isListening ? (
            <Button
              onClick={decoder.stopListening}
              variant="outline"
              className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
            >
              <MicOff className="h-4 w-4 mr-2" /> Stop Listening
            </Button>
          ) : (
            <Button
              onClick={decoder.startListening}
              variant="outline"
              className="border-telegraph-accent/50 text-telegraph-accent hover:bg-telegraph-accent/10"
            >
              <Mic className="h-4 w-4 mr-2" /> Start Listening
            </Button>
          )}

          {/* Live indicators */}
          {decoder.isListening && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className={`block h-2.5 w-2.5 rounded-full ${decoder.toneDetected ? 'bg-telegraph-accent shadow-[0_0_8px_rgba(245,158,11,0.6)]' : 'bg-telegraph-muted/30'} transition-all duration-75`} />
                <span className="text-xs text-telegraph-muted">
                  {decoder.toneDetected ? 'Tone' : 'Silent'}
                </span>
              </div>
              <span className="animate-pulse text-xs text-red-400">● REC</span>
            </div>
          )}
        </div>

        {/* Volume meter */}
        {decoder.isListening && (
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-telegraph-muted">
              <span>Volume</span>
              <span>Threshold: {volumeThreshold.toFixed(3)}</span>
            </div>
            <div className="relative h-3 w-full rounded-full bg-telegraph-bg overflow-hidden border border-telegraph-border">
              <div
                className={`h-full rounded-full transition-all duration-75 ${decoder.toneDetected ? 'bg-telegraph-accent' : 'bg-telegraph-muted/40'}`}
                style={{ width: `${decoder.volume * 100}%` }}
              />
              {/* threshold line */}
              <div
                className="absolute top-0 h-full w-0.5 bg-red-400/60"
                style={{ left: `${Math.min(volumeThreshold * 1000, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Current signals */}
        {decoder.currentSignals && (
          <div className="flex items-center gap-1 min-h-[1.5rem]">
            <span className="text-xs text-telegraph-muted mr-2">Current:</span>
            {decoder.currentSignals.split('').map((s, i) => (
              <span
                key={i}
                className={`inline-block rounded-full bg-telegraph-accent animate-scale-in ${s === '.' ? 'h-2 w-2' : 'h-2 w-6'}`}
              />
            ))}
          </div>
        )}

        {/* Raw sequence */}
        {decoder.rawSequence && (
          <div className="rounded-md bg-telegraph-bg border border-telegraph-border p-3 font-mono text-sm text-telegraph-accent break-all">
            {decoder.rawSequence}
          </div>
        )}

        {/* Decoded text */}
        <div className="min-h-[4rem] rounded-md bg-telegraph-bg border border-telegraph-border p-4 font-mono text-xl text-telegraph-text break-all leading-relaxed">
          {decoder.decodedText || <span className="text-telegraph-muted italic text-base">Decoded text will appear here...</span>}
          {decoder.isListening && <span className="inline-block w-0.5 h-5 bg-telegraph-accent animate-pulse ml-0.5 align-middle" />}
        </div>

        {/* Settings */}
        <details className="group">
          <summary className="text-xs text-telegraph-muted cursor-pointer hover:text-telegraph-accent transition-colors select-none">
            ⚙️ Detection Settings
          </summary>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SliderCtrl label="Target Frequency" value={targetFrequency} min={200} max={1200} step={10} unit="Hz" onChange={setTargetFrequency} />
            <SliderCtrl label="Volume Threshold" value={volumeThreshold} min={0.005} max={0.2} step={0.005} unit="" onChange={setVolumeThreshold} displayValue={volumeThreshold.toFixed(3)} />
            <SliderCtrl label="Dot Threshold" value={dotThreshold} min={80} max={500} step={10} unit="ms" onChange={setDotThreshold} />
            <SliderCtrl label="Letter Gap" value={letterGap} min={200} max={2000} step={50} unit="ms" onChange={setLetterGap} />
            <SliderCtrl label="Word Gap" value={wordGap} min={500} max={3000} step={50} unit="ms" onChange={setWordGap} />
          </div>
        </details>
      </CardContent>
    </Card>
  );
}

function SliderCtrl({ label, value, min, max, step, unit, onChange, displayValue }: {
  label: string; value: number; min: number; max: number; step: number; unit: string;
  onChange: (v: number) => void; displayValue?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-telegraph-muted">{label}</span>
        <span className="text-telegraph-accent font-mono">{displayValue ?? value}{unit}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={([v]) => onChange(v)} />
    </div>
  );
}
