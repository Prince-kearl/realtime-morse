import { useState } from 'react';
import { useTelegraph } from '@/hooks/useTelegraph';
import { useIsMobile } from '@/hooks/use-mobile';
import { TelegraphKey } from '@/components/TelegraphKey';
import { SignalVisualizer } from '@/components/SignalVisualizer';
import { DecodedOutput } from '@/components/DecodedOutput';
import { ControlsPanel } from '@/components/ControlsPanel';
import { MessageHistory } from '@/components/MessageHistory';
import { MorseReference } from '@/components/MorseReference';
import { TextToMorse } from '@/components/TextToMorse';
import { AudioDecoder } from '@/components/AudioDecoder';
import { MainLayout } from '@/components/MainLayout';

const Index = () => {
  const isMobile = useIsMobile();
  const [inputMode, setInputMode] = useState<'keyboard' | 'button'>(isMobile ? 'button' : 'keyboard');
  const telegraph = useTelegraph();

  return (
    <MainLayout>
      <div className="space-y-6">
        <section className="rounded-[32px] border border-slate-200/80 bg-white/95 p-6 shadow-xl shadow-slate-200/20">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Realtime Morse</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">Your full telegraph console</h1>
              <p className="mt-3 text-sm leading-6 text-slate-500">Keep all Morse tools, decoding, and operator controls together in a modern messaging-inspired interface.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[24px] bg-slate-50 p-4 text-sm text-slate-700 shadow-sm">
                <p className="uppercase tracking-[0.35em] text-slate-400">Decoder</p>
                <p className="mt-2 text-xl font-semibold text-slate-900">Live</p>
              </div>
              <div className="rounded-[24px] bg-slate-50 p-4 text-sm text-slate-700 shadow-sm">
                <p className="uppercase tracking-[0.35em] text-slate-400">Input</p>
                <p className="mt-2 text-xl font-semibold text-slate-900">Adaptive</p>
              </div>
              <div className="rounded-[24px] bg-slate-50 p-4 text-sm text-slate-700 shadow-sm">
                <p className="uppercase tracking-[0.35em] text-slate-400">History</p>
                <p className="mt-2 text-xl font-semibold text-slate-900">Saved</p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
          <div className="space-y-6">
            <TelegraphKey
              isPressing={telegraph.isPressing}
              inputMode={inputMode}
              onPressStart={telegraph.handlePressStart}
              onPressEnd={telegraph.handlePressEnd}
            />

            <div className="rounded-[32px] border border-slate-200/80 bg-white/95 p-5 shadow-xl shadow-slate-200/20">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Live status</p>
              <div className="mt-4 grid gap-3">
                <div className="rounded-[24px] bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Current mode</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{inputMode === 'keyboard' ? 'Keyboard' : 'Button'}</p>
                </div>
                <div className="rounded-[24px] bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Decoded text</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900 break-words">{telegraph.decodedText || 'Waiting for input...'}</p>
                </div>
              </div>
            </div>

            <MessageHistory history={telegraph.history} />
          </div>

          <div className="space-y-6">
            <SignalVisualizer
              isPressing={telegraph.isPressing}
              pressDuration={telegraph.pressDuration}
              dotThreshold={telegraph.settings.dotThreshold}
              currentSignals={telegraph.currentSignals}
              rawSequence={telegraph.rawSequence}
            />

            <DecodedOutput text={telegraph.decodedText} />

            <ControlsPanel
              settings={telegraph.settings}
              inputMode={inputMode}
              onSettingsChange={telegraph.setSettings}
              onInputModeChange={setInputMode}
              onReset={telegraph.reset}
            />

            <TextToMorse />

            <AudioDecoder />

            <MorseReference />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
