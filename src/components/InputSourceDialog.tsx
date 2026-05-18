import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Radio, Mic, Keyboard, Type } from 'lucide-react';

export type InputSource = 'telegraph' | 'microphone' | 'keyboard' | 'text';

export interface InputSelection {
  source: InputSource;
  audioDeviceId?: string;
}

interface Props {
  open: boolean;
  onSelect: (sel: InputSelection) => void;
  onClose?: () => void;
  initial?: InputSource;
}

const OPTIONS: { id: InputSource; label: string; desc: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'telegraph', label: 'Telegraph Sounder', desc: 'Tap an on-screen key to send dots and dashes', icon: Radio },
  { id: 'microphone', label: 'Microphone', desc: 'Decode external Morse audio from a connected sounder', icon: Mic },
  { id: 'keyboard', label: 'Keyboard (Spacebar)', desc: 'Hold spacebar — short press = dot, long = dash', icon: Keyboard },
  { id: 'text', label: 'Text → Morse', desc: 'Type plain text and auto-encode it to Morse', icon: Type },
];

export function InputSourceDialog({ open, onSelect, onClose, initial }: Props) {
  const [selected, setSelected] = useState<InputSource>(initial ?? 'telegraph');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState<string>('default');
  const [loadingDevices, setLoadingDevices] = useState(false);

  useEffect(() => {
    if (selected !== 'microphone') return;
    setLoadingDevices(true);
    (async () => {
      try {
        // Need a permission grant before labels are populated
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop());
        const all = await navigator.mediaDevices.enumerateDevices();
        const inputs = all.filter(d => d.kind === 'audioinput');
        setDevices(inputs);
        if (inputs[0]) setDeviceId(inputs[0].deviceId);
      } catch {
        setDevices([]);
      } finally {
        setLoadingDevices(false);
      }
    })();
  }, [selected]);

  const confirm = () => {
    const selection: InputSelection = {
      source: selected,
      audioDeviceId: selected === 'microphone' ? deviceId : undefined,
    };
    localStorage.setItem('morse-input-selection', JSON.stringify(selection));
    onSelect(selection);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose?.()}>
      <DialogContent className="bg-telegraph-card border-telegraph-border text-telegraph-text max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-telegraph-text">Select your input source</DialogTitle>
          <DialogDescription className="text-telegraph-muted">
            How would you like to send Morse code in this chat?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {OPTIONS.map(opt => {
            const Icon = opt.icon;
            const active = selected === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setSelected(opt.id)}
                className={`w-full text-left rounded-md border p-3 flex items-start gap-3 transition-colors ${
                  active
                    ? 'border-telegraph-accent bg-telegraph-accent/10'
                    : 'border-telegraph-border bg-telegraph-bg hover:border-telegraph-accent/50'
                }`}
              >
                <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${active ? 'text-telegraph-accent' : 'text-telegraph-muted'}`} />
                <div className="flex-1">
                  <div className={`font-medium text-sm ${active ? 'text-telegraph-accent' : 'text-telegraph-text'}`}>{opt.label}</div>
                  <div className="text-xs text-telegraph-muted mt-0.5">{opt.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {selected === 'microphone' && (
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-telegraph-muted">Audio input device</label>
            {loadingDevices ? (
              <div className="text-sm text-telegraph-muted">Requesting microphone access…</div>
            ) : devices.length === 0 ? (
              <div className="text-sm text-destructive">No microphone detected or permission denied.</div>
            ) : (
              <Select value={deviceId} onValueChange={setDeviceId}>
                <SelectTrigger className="bg-telegraph-bg border-telegraph-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-telegraph-card border-telegraph-border">
                  {devices.map(d => (
                    <SelectItem key={d.deviceId} value={d.deviceId}>
                      {d.label || `Microphone ${d.deviceId.slice(0, 6)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          {onClose && (
            <Button variant="ghost" onClick={onClose} className="text-telegraph-muted">Cancel</Button>
          )}
          <Button onClick={confirm} className="bg-telegraph-accent text-telegraph-bg hover:bg-telegraph-accent/90">
            Use this input
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
