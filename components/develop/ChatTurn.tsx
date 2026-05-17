'use client';

import { tokens } from '@/lib/tokens';

export type Speaker = 'user' | 'opus' | 'sonnet' | 'grok';

const SPEAKER_LABEL: Record<Speaker, string> = {
  user: 'You',
  opus: 'Bellbird · Opus 4.7',
  sonnet: 'Bellbird · Sonnet 4.6',
  grok: 'Grok-4',
};

export function ChatTurn({
  speaker,
  text,
  streaming,
}: {
  speaker: Speaker;
  text: string;
  streaming?: boolean;
}) {
  const isAssistant = speaker !== 'user';
  return (
    <div>
      <div
        className="font-sans text-[10px] tracking-[0.22em] uppercase mb-3"
        style={{ color: isAssistant ? tokens.chime : tokens.whisper }}
      >
        {SPEAKER_LABEL[speaker]}
        {streaming && (
          <span className="ml-2" style={{ color: tokens.whisper }}>
            …
          </span>
        )}
      </div>
      <div
        className="font-serif text-[17px] leading-[1.65] whitespace-pre-wrap"
        style={{
          fontWeight: 340,
          color: isAssistant ? tokens.ink : tokens.ash,
          maxWidth: '62ch',
        }}
      >
        {text}
      </div>
    </div>
  );
}
