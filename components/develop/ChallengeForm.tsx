'use client';

import { useState, useTransition } from 'react';
import { tokens } from '@/lib/tokens';

export function ChallengeForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (text: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [text, setText] = useState('');
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!text.trim()) return;
    startTransition(async () => {
      await onSubmit(text.trim());
    });
  }

  return (
    <form
      onSubmit={submit}
      className="p-5 mt-3"
      style={{ background: tokens.mist, border: `1px solid ${tokens.hairline}` }}
    >
      <div
        className="font-sans text-[10px] tracking-[0.22em] uppercase mb-3"
        style={{ color: tokens.whisper }}
      >
        Your challenge
      </div>
      <textarea
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="Name what Opus missed. Specific, structural — not just disagreement."
        className="font-serif text-[15px] leading-[1.55] w-full bg-transparent resize-none"
        style={{
          fontWeight: 340,
          color: tokens.ink,
          outline: 'none',
        }}
        disabled={pending}
      />
      <div className="mt-4 flex items-center gap-5">
        <button
          type="submit"
          disabled={pending || !text.trim()}
          className="font-sans text-[10px] tracking-[0.22em] uppercase btn-quiet"
          style={{
            color: tokens.ink,
            borderBottom: `1px solid ${tokens.ink}`,
            paddingBottom: 4,
            opacity: pending || !text.trim() ? 0.5 : 1,
          }}
        >
          {pending ? 'Re-evaluating' : 'Submit challenge'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="font-sans text-[10px] tracking-[0.22em] uppercase btn-quiet"
          style={{ color: tokens.whisper }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
