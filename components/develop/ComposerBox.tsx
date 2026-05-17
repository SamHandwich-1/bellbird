'use client';

import { ArrowUpRight } from 'lucide-react';
import { tokens } from '@/lib/tokens';

export function ComposerBox({
  value,
  onChange,
  onSubmit,
  onMarkReady,
  pending,
  readyDisabled,
  pendingLabel,
  rightSlot,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onMarkReady: () => void;
  pending: boolean;
  readyDisabled: boolean;
  pendingLabel?: string;
  rightSlot?: React.ReactNode;
}) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (!pending && value.trim()) onSubmit();
    }
  }

  return (
    <div
      className="p-5"
      style={{ background: tokens.mist, border: `1px solid ${tokens.hairline}` }}
    >
      <div
        className="font-sans text-[10px] tracking-[0.22em] uppercase mb-3"
        style={{ color: tokens.whisper }}
      >
        Your turn
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={3}
        placeholder="Continue the conversation, or paste news/data for impact analysis…"
        className="font-serif text-[16px] bg-transparent w-full leading-[1.6] resize-none"
        style={{
          fontWeight: 340,
          color: tokens.ink,
          outline: 'none',
        }}
        disabled={pending}
      />
      <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={onSubmit}
            disabled={pending || !value.trim()}
            className="font-sans text-[10px] tracking-[0.22em] uppercase btn-quiet inline-flex items-center gap-1.5"
            style={{
              color: tokens.ink,
              opacity: pending || !value.trim() ? 0.5 : 1,
            }}
          >
            {pending && pendingLabel ? pendingLabel : 'Send'}
            <ArrowUpRight size={11} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={onMarkReady}
            disabled={pending || readyDisabled}
            className="font-sans text-[10px] tracking-[0.16em] uppercase btn-quiet"
            style={{
              color: tokens.chime,
              opacity: pending || readyDisabled ? 0.5 : 1,
            }}
          >
            Ready for review
          </button>
        </div>
        {rightSlot}
      </div>
    </div>
  );
}
