import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface TelegraphKeyProps {
  isPressing: boolean;
  inputMode: 'keyboard' | 'button';
  onPressStart: () => void;
  onPressEnd: () => void;
}

export function TelegraphKey({ isPressing, inputMode, onPressStart, onPressEnd }: TelegraphKeyProps) {
  // Keyboard mode
  useEffect(() => {
    if (inputMode !== 'keyboard') return;
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        onPressStart();
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        onPressEnd();
      }
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [inputMode, onPressStart, onPressEnd]);

  return (
    <Card className="border-telegraph-border bg-telegraph-card">
      <CardContent className="flex flex-col items-center gap-4 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-telegraph-muted">
          {inputMode === 'keyboard' ? 'Press & Hold Spacebar' : 'Tap & Hold Button'}
        </h2>
        <button
          onMouseDown={inputMode === 'button' ? onPressStart : undefined}
          onMouseUp={inputMode === 'button' ? onPressEnd : undefined}
          onMouseLeave={inputMode === 'button' && isPressing ? onPressEnd : undefined}
          onTouchStart={inputMode === 'button' ? (e) => { e.preventDefault(); onPressStart(); } : undefined}
          onTouchEnd={inputMode === 'button' ? (e) => { e.preventDefault(); onPressEnd(); } : undefined}
          className={`
            relative h-28 w-28 rounded-full border-4 transition-all duration-100 select-none
            ${isPressing
              ? 'border-telegraph-accent bg-telegraph-accent/20 shadow-[0_0_40px_rgba(245,158,11,0.4)] scale-95'
              : 'border-telegraph-border bg-telegraph-card hover:border-telegraph-accent/50 scale-100'
            }
          `}
          aria-label="Telegraph key"
        >
          <span className={`block h-4 w-4 rounded-full mx-auto transition-all ${isPressing ? 'bg-telegraph-accent shadow-[0_0_12px_rgba(245,158,11,0.8)]' : 'bg-telegraph-muted'}`} />
        </button>
        <p className="text-xs text-telegraph-muted">
          {inputMode === 'keyboard' ? '⌨️ Keyboard Mode' : '👆 Button Mode'}
        </p>
      </CardContent>
    </Card>
  );
}
