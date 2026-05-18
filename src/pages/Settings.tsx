import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MainLayout } from '@/components/MainLayout';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface Settings {
  audioEnabled: boolean;
  dotThreshold: number;
  letterGap: number;
  wordGap: number;
  targetFrequency: number;
  volumeThreshold: number;
  theme: 'dark' | 'light';
  compactMode: boolean;
  autoScroll: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  audioEnabled: true,
  dotThreshold: 200,
  letterGap: 600,
  wordGap: 1400,
  targetFrequency: 600,
  volumeThreshold: 0.05,
  theme: 'dark',
  compactMode: false,
  autoScroll: true,
};

export default function Settings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    const saved = localStorage.getItem('morse-settings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('morse-settings', JSON.stringify(settings));
    setHasChanges(false);
    toast.success('Settings saved');
  };

  const handleReset = () => {
    if (confirm('Reset all settings to default?')) {
      setSettings(DEFAULT_SETTINGS);
      localStorage.setItem('morse-settings', JSON.stringify(DEFAULT_SETTINGS));
      setHasChanges(false);
      toast.success('Settings reset to default');
    }
  };

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(s => ({ ...s, [key]: value }));
    setHasChanges(true);
  };

  return (
    <MainLayout>
      <ScrollArea className="flex-1">
        <div className="min-h-screen bg-telegraph-bg text-telegraph-text">
          {/* Header */}
          <header className="border-b border-telegraph-border px-4 py-6 bg-telegraph-card">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-telegraph-text">
              ⚙️ Settings
            </h1>
            <p className="text-sm text-telegraph-muted mt-1">Customize your morse telegraph experience</p>
          </header>

          <main className="mx-auto max-w-3xl px-4 py-6 space-y-6">
            {/* Audio Settings */}
            <Card className="border-telegraph-border bg-telegraph-card">
              <CardHeader>
                <CardTitle className="text-sm">Audio Settings</CardTitle>
                <CardDescription className="text-xs">Configure audio playback and detection</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Audio enabled */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-telegraph-text">Audio Playback</p>
                    <p className="text-xs text-telegraph-muted">Play sounds when encoding/decoding morse</p>
                  </div>
                  <Switch
                    checked={settings.audioEnabled}
                    onCheckedChange={v => updateSetting('audioEnabled', v)}
                  />
                </div>

                {/* Dot threshold */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm text-telegraph-text">Dot Threshold</label>
                    <span className="text-xs font-mono text-telegraph-accent">{settings.dotThreshold}ms</span>
                  </div>
                  <Slider
                    value={[settings.dotThreshold]}
                    min={80}
                    max={500}
                    step={10}
                    onValueChange={([v]) => updateSetting('dotThreshold', v)}
                  />
                  <p className="text-xs text-telegraph-muted mt-1">Time threshold between dot and dash</p>
                </div>

                {/* Letter gap */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm text-telegraph-text">Letter Gap</label>
                    <span className="text-xs font-mono text-telegraph-accent">{settings.letterGap}ms</span>
                  </div>
                  <Slider
                    value={[settings.letterGap]}
                    min={200}
                    max={2000}
                    step={50}
                    onValueChange={([v]) => updateSetting('letterGap', v)}
                  />
                  <p className="text-xs text-telegraph-muted mt-1">Time between letters in a word</p>
                </div>

                {/* Word gap */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm text-telegraph-text">Word Gap</label>
                    <span className="text-xs font-mono text-telegraph-accent">{settings.wordGap}ms</span>
                  </div>
                  <Slider
                    value={[settings.wordGap]}
                    min={500}
                    max={3000}
                    step={50}
                    onValueChange={([v]) => updateSetting('wordGap', v)}
                  />
                  <p className="text-xs text-telegraph-muted mt-1">Time between words</p>
                </div>

                {/* Target frequency */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm text-telegraph-text">Target Frequency</label>
                    <span className="text-xs font-mono text-telegraph-accent">{settings.targetFrequency}Hz</span>
                  </div>
                  <Slider
                    value={[settings.targetFrequency]}
                    min={200}
                    max={1200}
                    step={10}
                    onValueChange={([v]) => updateSetting('targetFrequency', v)}
                  />
                  <p className="text-xs text-telegraph-muted mt-1">Frequency for morse tone generation</p>
                </div>

                {/* Volume threshold */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm text-telegraph-text">Volume Threshold</label>
                    <span className="text-xs font-mono text-telegraph-accent">{(settings.volumeThreshold * 100).toFixed(1)}%</span>
                  </div>
                  <Slider
                    value={[settings.volumeThreshold * 100]}
                    min={1}
                    max={50}
                    step={1}
                    onValueChange={([v]) => updateSetting('volumeThreshold', v / 100)}
                  />
                  <p className="text-xs text-telegraph-muted mt-1">Microphone sensitivity threshold</p>
                </div>
              </CardContent>
            </Card>

            {/* Display Settings */}
            <Card className="border-telegraph-border bg-telegraph-card">
              <CardHeader>
                <CardTitle className="text-sm">Display Settings</CardTitle>
                <CardDescription className="text-xs">Customize the user interface</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Compact mode */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-telegraph-text">Compact Mode</p>
                    <p className="text-xs text-telegraph-muted">Reduce spacing and button sizes</p>
                  </div>
                  <Switch
                    checked={settings.compactMode}
                    onCheckedChange={v => updateSetting('compactMode', v)}
                  />
                </div>

                {/* Auto scroll */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-telegraph-text">Auto-scroll Messages</p>
                    <p className="text-xs text-telegraph-muted">Automatically scroll to newest messages</p>
                  </div>
                  <Switch
                    checked={settings.autoScroll}
                    onCheckedChange={v => updateSetting('autoScroll', v)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Performance */}
            <Card className="border-telegraph-border bg-telegraph-card">
              <CardHeader>
                <CardTitle className="text-sm">Performance</CardTitle>
                <CardDescription className="text-xs">Optimize app performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-xs text-telegraph-muted space-y-2">
                  <p>• Adjusting audio thresholds can improve detection accuracy</p>
                  <p>• Frequency should match your morse code transmitter</p>
                  <p>• Volume threshold higher = less sensitive (requires louder signals)</p>
                </div>
              </CardContent>
            </Card>

            {/* Action buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleSave}
                disabled={!hasChanges}
                className="flex-1 bg-telegraph-accent text-telegraph-bg hover:bg-telegraph-accent/90 disabled:opacity-50"
              >
                Save Settings
              </Button>
              <Button
                onClick={handleReset}
                variant="outline"
                className="flex-1 border-telegraph-border text-telegraph-muted hover:text-telegraph-accent"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Default
              </Button>
            </div>

            {/* Info */}
            <Card className="border-telegraph-border/50 bg-telegraph-card/50">
              <CardContent className="pt-6 text-xs text-telegraph-muted space-y-2">
                <p>• Settings are stored locally in your browser</p>
                <p>• Clearing browser data will reset settings</p>
                <p>• Settings sync is not available across devices</p>
              </CardContent>
            </Card>
          </main>
        </div>
      </ScrollArea>
    </MainLayout>
  );
}
