import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MainLayout } from '@/components/MainLayout';
import { CHAR_TO_MORSE } from '@/lib/morse';
import { Copy, Check } from 'lucide-react';

export default function Reference() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const letters = Object.entries(CHAR_TO_MORSE).filter(([k]) => /^[A-Z]$/.test(k));
  const numbers = Object.entries(CHAR_TO_MORSE).filter(([k]) => /^[0-9]$/.test(k));
  const punctuation = Object.entries(CHAR_TO_MORSE).filter(([k]) => !/^[A-Z0-9]$/.test(k));

  const copyToClipboard = (morse: string, code: string) => {
    navigator.clipboard.writeText(morse);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const MorseCard = ({ char, code }: { char: string; code: string }) => (
    <div
      className="p-3 rounded-lg border border-telegraph-border bg-telegraph-card hover:border-telegraph-accent/50 transition-colors cursor-pointer group"
      onClick={() => copyToClipboard(code, char)}
    >
      <p className="text-lg font-bold text-telegraph-text mb-1">{char}</p>
      <p className="font-mono text-sm text-telegraph-accent mb-2">{code}</p>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        {copiedCode === char ? (
          <span className="text-xs text-green-400 flex items-center gap-1">
            <Check className="h-3 w-3" /> Copied!
          </span>
        ) : (
          <span className="text-xs text-telegraph-muted flex items-center gap-1">
            <Copy className="h-3 w-3" /> Copy
          </span>
        )}
      </div>
    </div>
  );

  return (
    <MainLayout>
      <ScrollArea className="flex-1">
        <div className="min-h-screen bg-telegraph-bg text-telegraph-text">
          {/* Header */}
          <header className="border-b border-telegraph-border px-4 py-6 bg-telegraph-card">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-telegraph-text">
              📖 Morse Code Reference
            </h1>
            <p className="text-sm text-telegraph-muted mt-1">Complete guide to all morse code characters</p>
          </header>

          <main className="mx-auto max-w-6xl px-4 py-6 space-y-8">
            {/* Legend */}
            <Card className="border-telegraph-border bg-telegraph-card">
              <CardHeader>
                <CardTitle className="text-sm">Understanding Morse Code</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-telegraph-muted mb-1">• (Dot)</p>
                    <p className="text-xs text-telegraph-text">Short sound or mark</p>
                    <p className="text-xs text-telegraph-accent font-mono mt-1">Duration: 1 unit</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-telegraph-muted mb-1">- (Dash)</p>
                    <p className="text-xs text-telegraph-text">Long sound or mark</p>
                    <p className="text-xs text-telegraph-accent font-mono mt-1">Duration: 3 units</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-telegraph-muted mb-1">/ (Space)</p>
                    <p className="text-xs text-telegraph-text">Word separator</p>
                    <p className="text-xs text-telegraph-accent font-mono mt-1">Duration: 7 units</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Letters */}
            <section>
              <h2 className="text-xl font-bold text-telegraph-text mb-4">Letters (A-Z)</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {letters.map(([char, code]) => (
                  <MorseCard key={char} char={char} code={code} />
                ))}
              </div>
            </section>

            {/* Numbers */}
            <section>
              <h2 className="text-xl font-bold text-telegraph-text mb-4">Numbers (0-9)</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {numbers.map(([char, code]) => (
                  <MorseCard key={char} char={char} code={code} />
                ))}
              </div>
            </section>

            {/* Punctuation */}
            {punctuation.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-telegraph-text mb-4">Punctuation & Symbols</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {punctuation.map(([char, code]) => (
                    <MorseCard key={char} char={char} code={code} />
                  ))}
                </div>
              </section>
            )}

            {/* Common phrases */}
            <section>
              <Card className="border-telegraph-border bg-telegraph-card">
                <CardHeader>
                  <CardTitle className="text-sm">Common Morse Code Phrases</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { phrase: 'SOS', meaning: 'International distress signal' },
                      { phrase: 'PSE', meaning: 'Please' },
                      { phrase: 'RST', meaning: 'Readability, Signal strength, Tone' },
                      { phrase: 'QSO', meaning: 'Conversation' },
                      { phrase: 'dit', meaning: 'Dot sound' },
                      { phrase: 'dah', meaning: 'Dash sound' },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between pb-3 border-b border-telegraph-border/50 last:border-b-0">
                        <div>
                          <p className="font-mono font-semibold text-telegraph-accent">{item.phrase}</p>
                          <p className="text-xs text-telegraph-muted">{item.meaning}</p>
                        </div>
                        <p className="font-mono text-sm text-telegraph-text text-right">
                          {item.phrase.split('').map(c => CHAR_TO_MORSE[c]).join(' ')}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Tips */}
            <section>
              <Card className="border-telegraph-border bg-telegraph-card">
                <CardHeader>
                  <CardTitle className="text-sm">📝 Tips for Learning</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-telegraph-text">
                    <li className="flex gap-3">
                      <span className="text-telegraph-accent font-bold">1.</span>
                      <span>Start with short characters like E (.), T (-), and A (.-)</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-telegraph-accent font-bold">2.</span>
                      <span>Practice groups of similar patterns together</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-telegraph-accent font-bold">3.</span>
                      <span>Use the audio player to listen to sounds repeatedly</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-telegraph-accent font-bold">4.</span>
                      <span>Keep a notebook and write down patterns as you learn</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-telegraph-accent font-bold">5.</span>
                      <span>Practice with actual morse code transmission</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </section>
          </main>
        </div>
      </ScrollArea>
    </MainLayout>
  );
}
