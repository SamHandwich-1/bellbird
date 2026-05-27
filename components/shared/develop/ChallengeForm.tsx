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
      style={{
        background: tokens.panelLift,
        border: `1px solid ${tokens.line}`,
        padding: 18,
        marginTop: 14,
      }}
    >
      <div className="label" style={{ color: tokens.muted, marginBottom: 10 }}>
        Your challenge
      </div>
      <textarea
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="Name what Opus missed. Specific, structural — not just disagreement."
        className="serif"
        style={{
          fontSize: 14.5,
          lineHeight: 1.55,
          width: '100%',
          background: 'transparent',
          resize: 'none',
          color: tokens.text,
          outline: 'none',
          border: 'none',
        }}
        disabled={pending}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 14 }}>
        <button
          type="submit"
          disabled={pending || !text.trim()}
          className="label btn-quiet"
          style={{
            color: tokens.chime,
            borderBottom: `1px solid ${tokens.chime}`,
            paddingBottom: 4,
            background: 'transparent',
            border: 'none',
            borderBottomWidth: 1,
            borderBottomStyle: 'solid',
            cursor: pending || !text.trim() ? 'wait' : 'pointer',
            opacity: pending || !text.trim() ? 0.5 : 1,
          }}
        >
          {pending ? 'Re-evaluating' : 'Submit challenge'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="label btn-quiet"
          style={{
            color: tokens.muted,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
