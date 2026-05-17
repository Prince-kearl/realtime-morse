import { useState } from 'react';
import { Volume2 } from 'lucide-react';
import { playMorse } from '@/lib/morseEncoder';
import { Avatar } from './Avatar';

interface Props {
  morse: string;
  decoded: string;
  isOwn: boolean;
  timestamp: string;
  inputSource?: string;
  senderName?: string;
  showAvatar?: boolean;
}

export function ChatBubble({ morse, decoded, isOwn, timestamp, inputSource, senderName, showAvatar = true }: Props) {
  const [showMorse, setShowMorse] = useState(false);

  const time = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`flex items-end gap-2 mb-3 ${isOwn ? 'justify-end' : 'justify-start'}`}>
      {!isOwn && (
        <div className="w-8">
          {showAvatar && senderName ? <Avatar name={senderName} size={32} /> : null}
        </div>
      )}
      <div className={`max-w-[72%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        <button
          onClick={() => setShowMorse(s => !s)}
          className={`group text-left rounded-2xl px-4 py-2.5 transition-all ${
            isOwn
              ? 'bg-gradient-sent text-white rounded-br-md shadow-bubble'
              : 'bg-telegraph-bubble-in text-telegraph-text rounded-bl-md shadow-soft'
          }`}
          title="Tap to flip between Morse and decoded"
        >
          {showMorse ? (
            <div className="font-mono text-[15px] tracking-widest break-all leading-relaxed opacity-95">{morse}</div>
          ) : (
            <div className="text-[15px] break-words leading-snug">
              {decoded || <span className="opacity-60 italic">(empty)</span>}
            </div>
          )}
        </button>
        <div className={`flex items-center gap-1.5 mt-1 px-1 text-[10px] text-telegraph-muted ${isOwn ? 'flex-row-reverse' : ''}`}>
          <span>{time}</span>
          <span className="opacity-50">·</span>
          <button
            onClick={(e) => { e.stopPropagation(); playMorse(morse, { dotMs: 90 }); }}
            className="hover:text-telegraph-accent-2 transition-colors"
            title="Play as Morse audio"
          >
            <Volume2 className="h-3 w-3" />
          </button>
          {inputSource && (
            <>
              <span className="opacity-50">·</span>
              <span className="uppercase tracking-wider">{inputSource}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
