import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Volume2 } from 'lucide-react';
import { playMorse } from '@/lib/morseEncoder';

interface Props {
  morse: string;
  decoded: string;
  isOwn: boolean;
  timestamp: string;
  inputSource?: string;
}

export function ChatBubble({ morse, decoded, isOwn, timestamp, inputSource }: Props) {
  const [showMorse, setShowMorse] = useState(false);

  const time = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
      <div className="max-w-[75%] space-y-1">
        <div
          onClick={() => setShowMorse(s => !s)}
          className={`group cursor-pointer rounded-2xl px-4 py-2.5 transition-all ${
            isOwn
              ? 'bg-telegraph-accent text-telegraph-bg rounded-br-sm'
              : 'bg-telegraph-card border border-telegraph-border text-telegraph-text rounded-bl-sm'
          }`}
          title="Tap to toggle Morse / decoded view"
        >
          {showMorse ? (
            <div className="font-mono text-base tracking-widest break-all leading-relaxed">{morse}</div>
          ) : (
            <div className="text-base break-words">{decoded || <span className="opacity-50 italic">(empty)</span>}</div>
          )}
        </div>
        <div className={`flex items-center gap-2 px-1 text-[10px] text-telegraph-muted ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              playMorse(morse, { dotMs: 90 });
            }}
            className="hover:text-telegraph-accent transition-colors"
            title="Play as Morse audio"
          >
            <Volume2 className="h-3 w-3" />
          </button>
          {inputSource && <span className="uppercase tracking-wider">{inputSource}</span>}
          <span>·</span>
          <span>{time}</span>
          <span>·</span>
          <span>{showMorse ? 'morse' : 'text'}</span>
        </div>
      </div>
    </div>
  );
}
