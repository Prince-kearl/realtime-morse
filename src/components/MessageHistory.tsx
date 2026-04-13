import { useState } from 'react';
import { ChevronDown, Copy, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface MessageHistoryProps {
  history: string[];
}

export function MessageHistory({ history }: MessageHistoryProps) {
  const [open, setOpen] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const copyItem = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1200);
  };

  if (history.length === 0) return null;

  return (
    <Card className="border-telegraph-border bg-telegraph-card">
      <button
        className="w-full flex items-center justify-between p-4 text-left"
        onClick={() => setOpen(!open)}
      >
        <h2 className="text-sm font-semibold uppercase tracking-widest text-telegraph-muted">
          Message History ({history.length})
        </h2>
        <ChevronDown className={`h-4 w-4 text-telegraph-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <CardContent className="pt-0 px-4 pb-4 space-y-2">
          {history.map((msg, i) => (
            <div key={i} className="flex items-center justify-between rounded-md bg-telegraph-bg border border-telegraph-border p-3">
              <span className="font-mono text-sm text-telegraph-text truncate mr-2">{msg}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-telegraph-muted hover:text-telegraph-accent" onClick={() => copyItem(msg, i)}>
                {copiedIdx === i ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
}
