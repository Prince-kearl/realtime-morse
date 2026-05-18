import { AudioDecoder } from '@/components/AudioDecoder';
import { TextToMorse } from '@/components/TextToMorse';
import { MorseReference } from '@/components/MorseReference';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MainLayout } from '@/components/MainLayout';
import { Zap, Mic, MessageSquare } from 'lucide-react';

export default function Tools() {
  return (
    <MainLayout>
      <ScrollArea className="flex-1">
        <div className="min-h-screen bg-telegraph-bg text-telegraph-text">
          {/* Header */}
          <header className="border-b border-telegraph-border px-4 py-6 bg-telegraph-card">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-telegraph-text">
              🛠️ Morse Tools
            </h1>
            <p className="text-sm text-telegraph-muted mt-1">Utilities for encoding and decoding morse code</p>
          </header>

          <main className="mx-auto max-w-5xl px-4 py-6 space-y-6">
            {/* Overview cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-telegraph-border bg-telegraph-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Mic className="h-4 w-4 text-telegraph-accent" />
                    Audio Decoder
                  </CardTitle>
                  <CardDescription className="text-xs">Decode Morse from audio</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-telegraph-muted">Listen to morse code through your microphone and decode it in real time using frequency detection.</p>
                </CardContent>
              </Card>

              <Card className="border-telegraph-border bg-telegraph-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-telegraph-accent" />
                    Text Encoder
                  </CardTitle>
                  <CardDescription className="text-xs">Convert text to Morse</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-telegraph-muted">Type or paste text and convert it to morse code. Playback with audio and view the sequence.</p>
                </CardContent>
              </Card>

              <Card className="border-telegraph-border bg-telegraph-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Zap className="h-4 w-4 text-telegraph-accent" />
                    Reference
                  </CardTitle>
                  <CardDescription className="text-xs">Morse code guide</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-telegraph-muted">Quick reference for all morse code characters, numbers, and special symbols.</p>
                </CardContent>
              </Card>
            </div>

            {/* Tools */}
            <section className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-telegraph-text mb-4">Audio Morse Decoder</h2>
                <AudioDecoder />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-telegraph-text mb-4">Text to Morse Encoder</h2>
                <TextToMorse />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-telegraph-text mb-4">Morse Code Reference</h2>
                <MorseReference />
              </div>
            </section>
          </main>
        </div>
      </ScrollArea>
    </MainLayout>
  );
}
