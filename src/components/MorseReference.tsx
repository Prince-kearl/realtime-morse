import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { CHAR_TO_MORSE } from '@/lib/morse';

export function MorseReference() {
  const [open, setOpen] = useState(false);
  const letters = Object.entries(CHAR_TO_MORSE).filter(([k]) => /^[A-Z]$/.test(k));
  const numbers = Object.entries(CHAR_TO_MORSE).filter(([k]) => /^[0-9]$/.test(k));

  return (
    <Card className="border-telegraph-border bg-telegraph-card">
      <button className="w-full flex items-center justify-between p-4 text-left" onClick={() => setOpen(!open)}>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-telegraph-muted">Morse Reference</h2>
        <ChevronDown className={`h-4 w-4 text-telegraph-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <CardContent className="pt-0 px-4 pb-4">
          <div className="grid grid-cols-6 sm:grid-cols-9 gap-2">
            {[...letters, ...numbers].map(([char, code]) => (
              <div key={char} className="flex flex-col items-center rounded bg-telegraph-bg border border-telegraph-border p-2">
                <span className="text-sm font-bold text-telegraph-text">{char}</span>
                <span className="text-[10px] font-mono text-telegraph-accent">{code}</span>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
