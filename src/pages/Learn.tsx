import { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MainLayout } from '@/components/MainLayout';
import { CHAR_TO_MORSE } from '@/lib/morse';
import { Volume2, VolumeX } from 'lucide-react';

const MORSE_CHARS = Object.entries(CHAR_TO_MORSE).filter(([k]) => /^[A-Z0-9]$/.test(k));

export default function Learn() {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [showAnswer, setShowAnswer] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getDifficultyChars = () => {
    switch (difficulty) {
      case 'easy':
        return MORSE_CHARS.filter(([k]) => /^[A-E0-2]$/.test(k));
      case 'medium':
        return MORSE_CHARS.filter(([k]) => /^[A-Z0-5]$/.test(k));
      case 'hard':
        return MORSE_CHARS;
    }
  };

  const chars = getDifficultyChars();
  const currentChar = chars[currentIndex % chars.length];
  const [char, morse] = currentChar;

  const playMorse = useCallback(() => {
    if (!audioEnabled) return;
    
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const speed = 200; // ms per dot
    const playSequence = async () => {
      for (const symbol of morse) {
        const duration = symbol === '.' ? speed : speed * 3;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 600;
        gain.gain.value = 0.3;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration / 1000);
        
        await new Promise(r => setTimeout(r, duration + 100));
      }
    };

    playSequence();
  }, [audioEnabled, morse]);

  const handleGuess = (selectedChar: string, isCorrect: boolean) => {
    if (isCorrect) {
      setScore(score + 1);
      setStreak(streak + 1);
    } else {
      setStreak(0);
    }
    setShowAnswer(false);
    setCurrentIndex(currentIndex + 1);
  };

  const reset = () => {
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
  };

  return (
    <MainLayout>
      <ScrollArea className="flex-1">
        <div className="min-h-screen bg-telegraph-bg text-telegraph-text">
          {/* Header */}
          <header className="border-b border-telegraph-border px-4 py-6 bg-telegraph-card">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-telegraph-text">
              📚 Learn Morse Code
            </h1>
            <p className="text-sm text-telegraph-muted mt-1">Interactive morse code training</p>
          </header>

          <main className="mx-auto max-w-4xl px-4 py-6 space-y-6">
            {/* Difficulty selection */}
            <Card className="border-telegraph-border bg-telegraph-card">
              <CardHeader>
                <CardTitle className="text-sm">Difficulty Level</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                {(['easy', 'medium', 'hard'] as const).map(level => (
                  <Button
                    key={level}
                    onClick={() => { setDifficulty(level); reset(); }}
                    variant={difficulty === level ? 'default' : 'outline'}
                    className={difficulty === level
                      ? 'bg-telegraph-accent text-telegraph-bg hover:bg-telegraph-accent/90'
                      : 'border-telegraph-border text-telegraph-muted hover:text-telegraph-accent'
                    }
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Score display */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="border-telegraph-border bg-telegraph-card">
                <CardContent className="pt-6 text-center">
                  <p className="text-sm text-telegraph-muted mb-2">Score</p>
                  <p className="text-3xl font-bold text-telegraph-accent">{score}</p>
                </CardContent>
              </Card>
              <Card className="border-telegraph-border bg-telegraph-card">
                <CardContent className="pt-6 text-center">
                  <p className="text-sm text-telegraph-muted mb-2">Streak</p>
                  <p className="text-3xl font-bold text-orange-400">{streak}</p>
                </CardContent>
              </Card>
              <Card className="border-telegraph-border bg-telegraph-card">
                <CardContent className="pt-6 text-center">
                  <p className="text-sm text-telegraph-muted mb-2">Progress</p>
                  <p className="text-3xl font-bold text-cyan-400">{currentIndex}/{chars.length}</p>
                </CardContent>
              </Card>
            </div>

            {/* Learning card */}
            <Card className="border-telegraph-border bg-telegraph-card">
              <CardHeader>
                <CardTitle className="text-sm">What is this morse code?</CardTitle>
                <CardDescription className="text-xs">Listen to the morse code and guess the character</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Audio button */}
                <div className="flex gap-3">
                  <Button
                    onClick={playMorse}
                    variant="outline"
                    className="flex-1 border-telegraph-accent/50 text-telegraph-accent hover:bg-telegraph-accent/10"
                  >
                    <Volume2 className="h-4 w-4 mr-2" />
                    Play Sound
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setAudioEnabled(!audioEnabled)}
                    className={audioEnabled ? 'text-telegraph-accent' : 'text-telegraph-muted'}
                  >
                    {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  </Button>
                </div>

                {/* Morse display */}
                <div className="text-center">
                  <p className="text-sm text-telegraph-muted mb-2">Morse Code</p>
                  <p className="font-mono text-2xl text-telegraph-accent tracking-wider">{morse}</p>
                </div>

                {/* Answer section */}
                {!showAnswer ? (
                  <div className="grid grid-cols-2 gap-3">
                    {chars.map(([option]) => (
                      <button
                        key={option}
                        onClick={() => {
                          handleGuess(option, option === char);
                          setShowAnswer(true);
                        }}
                        className="py-3 rounded-lg font-bold text-lg border-2 border-telegraph-border bg-telegraph-bg text-telegraph-text hover:border-telegraph-accent hover:bg-telegraph-accent/10 transition-colors"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className={`text-center py-4 rounded-lg ${char === currentChar[0]
                      ? 'bg-green-500/10 border border-green-500/20'
                      : 'bg-red-500/10 border border-red-500/20'
                      }`}>
                      <p className="text-sm text-telegraph-muted mb-2">
                        {char === currentChar[0] ? '✓ Correct!' : '✗ Wrong'}
                      </p>
                      <p className="text-2xl font-bold text-telegraph-text">{currentChar[0]}</p>
                    </div>
                    <Button
                      onClick={() => handleGuess(char, char === currentChar[0])}
                      className="w-full bg-telegraph-accent text-telegraph-bg hover:bg-telegraph-accent/90"
                    >
                      Next
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reference */}
            <Card className="border-telegraph-border bg-telegraph-card">
              <CardHeader>
                <CardTitle className="text-sm">Quick Reference</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {chars.map(([c, code]) => (
                    <div key={c} className="text-center p-2 rounded bg-telegraph-bg border border-telegraph-border">
                      <p className="text-sm font-bold text-telegraph-text">{c}</p>
                      <p className="text-[10px] font-mono text-telegraph-accent">{code}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </ScrollArea>
    </MainLayout>
  );
}
