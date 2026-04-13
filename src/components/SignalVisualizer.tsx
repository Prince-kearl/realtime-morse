import { Card, CardContent } from '@/components/ui/card';

interface SignalVisualizerProps {
  isPressing: boolean;
  pressDuration: number;
  dotThreshold: number;
  currentSignals: string;
  rawSequence: string;
}

export function SignalVisualizer({ isPressing, pressDuration, dotThreshold, currentSignals, rawSequence }: SignalVisualizerProps) {
  const maxBar = dotThreshold * 3;
  const fillPercent = isPressing ? Math.min((pressDuration / maxBar) * 100, 100) : 0;
  const isDash = pressDuration >= dotThreshold;

  return (
    <Card className="border-telegraph-border bg-telegraph-card">
      <CardContent className="p-6 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-telegraph-muted">Signal</h2>

        {/* Press duration bar */}
        <div className="space-y-1">
          <div className="relative h-6 w-full rounded-full bg-telegraph-bg overflow-hidden border border-telegraph-border">
            <div
              className={`h-full transition-all duration-75 rounded-full ${isDash ? 'bg-orange-500' : 'bg-telegraph-accent'}`}
              style={{ width: `${fillPercent}%` }}
            />
            {/* Threshold marker */}
            <div
              className="absolute top-0 h-full w-0.5 bg-telegraph-muted/50"
              style={{ left: `${(dotThreshold / maxBar) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-telegraph-muted">
            <span>DOT</span>
            <span style={{ marginLeft: `${(dotThreshold / maxBar) * 100 - 10}%` }}>|</span>
            <span>DASH</span>
          </div>
        </div>

        {/* Current letter signals */}
        <div className="flex items-center gap-1 min-h-[2rem]">
          <span className="text-xs text-telegraph-muted mr-2">Current:</span>
          {currentSignals.split('').map((s, i) => (
            <span
              key={i}
              className={`inline-block rounded-full bg-telegraph-accent animate-scale-in ${s === '.' ? 'h-2 w-2' : 'h-2 w-6'}`}
            />
          ))}
        </div>

        {/* Full raw sequence */}
        <div className="min-h-[3rem] rounded-md bg-telegraph-bg border border-telegraph-border p-3 font-mono text-sm text-telegraph-accent break-all">
          {rawSequence || <span className="text-telegraph-muted italic">Signal sequence will appear here...</span>}
        </div>
      </CardContent>
    </Card>
  );
}
