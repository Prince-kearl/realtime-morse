import { useState } from 'react';
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
      <div className="max-w-[78%] space-y-1">
        <div
          onClick={() => setShowMorse(s => !s)}
          className={`group cursor-pointer rounded-3xl px-4 py-3 transition-all shadow-card ${
            isOwn
              ? 'bg-gradient-sent text-white rounded-br-md'
              : 'bg-white text-foreground rounded-bl-md border border-border'
          }`}
          title="Tap to toggle Morse / decoded view"
        >
          {showMorse ? (
            <div className="font-mono text-base tracking-widest break-all leading-relaxed">{morse}</div>
          ) : (
            <div className="text-[15px] break-words leading-snug">
              {decoded || <span className="opacity-60 italic">(empty)</span>}
            </div>
          )}
        </div>
        <div className={`flex items-center gap-2 px-2 text-[10px] text-muted-foreground ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <button
            onClick={(e) => { e.stopPropagation(); playMorse(morse, { dotMs: 90 }); }}
            className="hover:text-primary transition-colors"
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
