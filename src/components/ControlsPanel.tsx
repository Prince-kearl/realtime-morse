import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { RotateCcw, Volume2, VolumeX } from 'lucide-react';
import type { TelegraphSettings } from '@/hooks/useTelegraph';

interface ControlsPanelProps {
  settings: TelegraphSettings;
  inputMode: 'keyboard' | 'button';
  onSettingsChange: (s: TelegraphSettings) => void;
  onInputModeChange: (mode: 'keyboard' | 'button') => void;
  onReset: () => void;
}

export function ControlsPanel({ settings, inputMode, onSettingsChange, onInputModeChange, onReset }: ControlsPanelProps) {
  return (
    <Card className="border-telegraph-border bg-telegraph-card">
      <CardContent className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-telegraph-muted">Controls</h2>
          <Button variant="outline" size="sm" onClick={onReset} className="border-telegraph-border text-telegraph-muted hover:text-telegraph-accent hover:border-telegraph-accent">
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reset
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Input mode */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-telegraph-text">Input Mode</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-telegraph-muted">Button</span>
              <Switch
                checked={inputMode === 'keyboard'}
                onCheckedChange={(v) => onInputModeChange(v ? 'keyboard' : 'button')}
              />
              <span className="text-xs text-telegraph-muted">Keyboard</span>
            </div>
          </div>

          {/* Audio */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-telegraph-text">Audio</span>
            <div className="flex items-center gap-2">
              {settings.audioEnabled ? <Volume2 className="h-4 w-4 text-telegraph-accent" /> : <VolumeX className="h-4 w-4 text-telegraph-muted" />}
              <Switch
                checked={settings.audioEnabled}
                onCheckedChange={(v) => onSettingsChange({ ...settings, audioEnabled: v })}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <SliderControl
            label="Dot Threshold"
            value={settings.dotThreshold}
            min={80} max={500} step={10}
            unit="ms"
            onChange={(v) => onSettingsChange({ ...settings, dotThreshold: v })}
          />
          <SliderControl
            label="Letter Gap"
            value={settings.letterGap}
            min={200} max={2000} step={50}
            unit="ms"
            onChange={(v) => onSettingsChange({ ...settings, letterGap: v })}
          />
          <SliderControl
            label="Word Gap"
            value={settings.wordGap}
            min={500} max={3000} step={50}
            unit="ms"
            onChange={(v) => onSettingsChange({ ...settings, wordGap: v })}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function SliderControl({ label, value, min, max, step, unit, onChange }: {
  label: string; value: number; min: number; max: number; step: number; unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs">
        <span className="text-telegraph-muted">{label}</span>
        <span className="text-telegraph-accent font-mono">{value}{unit}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={([v]) => onChange(v)} />
    </div>
  );
}
