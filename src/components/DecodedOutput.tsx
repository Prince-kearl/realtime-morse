import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface DecodedOutputProps {
  text: string;
}

export function DecodedOutput({ text }: DecodedOutputProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Card className="border-telegraph-border bg-telegraph-card">
      <CardContent className="p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-telegraph-muted">Decoded Output</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            disabled={!text}
            className="h-8 w-8 text-telegraph-muted hover:text-telegraph-accent"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <div className="min-h-[6rem] rounded-md bg-telegraph-bg border border-telegraph-border p-4 font-mono text-2xl md:text-3xl text-telegraph-text break-all leading-relaxed">
          {text || <span className="text-telegraph-muted italic text-lg">Start tapping to decode...</span>}
          <span className="inline-block w-0.5 h-7 bg-telegraph-accent animate-pulse ml-0.5 align-middle" />
        </div>
      </CardContent>
    </Card>
  );
}
