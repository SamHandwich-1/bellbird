'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { renameConversation } from '@/app/(app)/develop/actions';
import { tokens } from '@/lib/tokens';
import type { Conversation } from '@/lib/types';

export function InlineEditableTitle({ conversation }: { conversation: Conversation }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const displayTitle = conversation.title ?? 'Untitled conversation';

  function startEditing() {
    setDraft(conversation.title ?? '');
    setEditing(true);
  }

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  function commit() {
    if (pending) return;
    const next = draft.trim();
    const current = (conversation.title ?? '').trim();

    // No-op if unchanged — close the editor without a write.
    if (next === current) {
      setEditing(false);
      return;
    }

    startTransition(async () => {
      const result = await renameConversation(
        conversation.id,
        next === '' ? null : next,
      );
      if ('error' in result) {
        toast.error(result.error);
        // Keep editing open so the user can retry without losing input.
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  function cancel() {
    setEditing(false);
    setDraft('');
  }

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancel();
    }
  }

  function onDisplayKeyDown(e: React.KeyboardEvent<HTMLHeadingElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      startEditing();
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={onInputKeyDown}
        disabled={pending}
        placeholder="Untitled conversation"
        className="font-serif text-[36px] tracking-tight w-full bg-transparent"
        style={{
          fontWeight: 340,
          color: tokens.ink,
          outline: 'none',
          borderBottom: `1px solid ${tokens.hairline}`,
          paddingBottom: 4,
        }}
      />
    );
  }

  return (
    <h1
      onClick={startEditing}
      onKeyDown={onDisplayKeyDown}
      tabIndex={0}
      role="button"
      aria-label="Rename conversation"
      className="font-serif text-[36px] tracking-tight"
      style={{
        fontWeight: 340,
        color: tokens.ink,
        cursor: 'text',
      }}
    >
      {displayTitle}
    </h1>
  );
}
