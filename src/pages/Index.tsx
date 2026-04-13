import { useState } from 'react';
import { useTelegraph } from '@/hooks/useTelegraph';
import { useIsMobile } from '@/hooks/use-mobile';
import { TelegraphKey } from '@/components/TelegraphKey';
import { SignalVisualizer } from '@/components/SignalVisualizer';
import { DecodedOutput } from '@/components/DecodedOutput';
import { ControlsPanel } from '@/components/ControlsPanel';
import { MessageHistory } from '@/components/MessageHistory';
import { MorseReference } from '@/components/MorseReference';

const Index = () => {
  const isMobile = useIsMobile();
  const [inputMode, setInputMode] = useState<'keyboard' | 'button'>(isMobile ? 'button' : 'keyboard');
  const telegraph = useTelegraph();

  return (
    <div className="min-h-screen bg-telegraph-bg text-telegraph-text">
      {/* Header */}
      <header className="border-b border-telegraph-border px-4 py-6 text-center">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-telegraph-text">
          ⚡ Morse Code Translator
        </h1>
        <p className="text-sm text-telegraph-muted mt-1">Real-time telegraph decoding system</p>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 space-y-5">
        {/* Top row: Key + Signal */}
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-5">
          <TelegraphKey
            isPressing={telegraph.isPressing}
            inputMode={inputMode}
            onPressStart={telegraph.handlePressStart}
            onPressEnd={telegraph.handlePressEnd}
          />
          <SignalVisualizer
            isPressing={telegraph.isPressing}
            pressDuration={telegraph.pressDuration}
            dotThreshold={telegraph.settings.dotThreshold}
            currentSignals={telegraph.currentSignals}
            rawSequence={telegraph.rawSequence}
          />
        </div>

        {/* Decoded output */}
        <DecodedOutput text={telegraph.decodedText} />

        {/* Controls */}
        <ControlsPanel
          settings={telegraph.settings}
          inputMode={inputMode}
          onSettingsChange={telegraph.setSettings}
          onInputModeChange={setInputMode}
          onReset={telegraph.reset}
        />

        {/* History & Reference */}
        <MessageHistory history={telegraph.history} />
        <MorseReference />
      </main>
    </div>
  );
};

export default Index;
