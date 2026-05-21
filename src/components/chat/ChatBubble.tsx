import { useState } from 'react';
import { Volume2, Check, CheckCheck } from 'lucide-react';
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
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1.5 px-1`}>
      <div
        onClick={() => setShowMorse(s => !s)}
        className={`relative max-w-[78%] sm:max-w-[65%] cursor-pointer rounded-lg px-2.5 pt-1.5 pb-1 shadow-bubble ${
          isOwn
            ? 'bg-wa-bubble-out text-foreground wa-tail-out rounded-tr-none'
            : 'bg-wa-bubble-in text-foreground wa-tail-in rounded-tl-none'
        }`}
        title="Tap to toggle Morse / decoded view"
      >
        {showMorse ? (
          <div className="font-mono text-[13px] tracking-widest break-all leading-relaxed pr-14">{morse}</div>
        ) : (
          <div className="text-[14.5px] break-words leading-snug pr-14 whitespace-pre-wrap">
            {decoded || <span className="opacity-60 italic">(empty)</span>}
          </div>
        )}
        <div className="float-right flex items-center gap-1 mt-0.5 -mb-0.5 text-[10.5px] text-muted-foreground select-none">
          <button
            onClick={(e) => { e.stopPropagation(); playMorse(morse, { dotMs: 90 }); }}
            className="hover:text-primary transition-colors"
            title="Play as Morse audio"
          >
            <Volume2 className="h-3 w-3" />
          </button>
          {inputSource && <span className="uppercase tracking-wide opacity-80">{inputSource}</span>}
          <span>{time}</span>
          {isOwn && <CheckCheck className="h-3.5 w-3.5 text-[hsl(var(--wa-tick))]" />}
        </div>
      </div>
    </div>
  );
}
