'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { tokens } from '@/lib/tokens';
import { renameConversation, deleteConversation } from '@/app/(app)/develop/actions';
import type { Conversation } from '@/lib/types';

function statusLabel(s: Conversation['status']): string {
  switch (s) {
    case 'open':
      return 'Open';
    case 'phase_2':
      return 'Structuring';
    case 'phase_3':
      return 'Stress test';
    case 'phase_4':
      return 'Adjudicating';
    case 'completed':
      return 'Completed';
    case 'discarded':
      return 'Discarded';
  }
}

function statusColor(s: Conversation['status']): string {
  switch (s) {
    case 'completed':
      return tokens.sage;
    case 'discarded':
      return tokens.terracotta;
    case 'phase_4':
      return tokens.chime;
    case 'phase_3':
      return tokens.amber;
    case 'phase_2':
      return tokens.steel;
    default:
      return tokens.whisper;
  }
}

export function ConversationListRow({ conversation }: { conversation: Conversation }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // Rename state
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Delete two-stage confirm
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  function startRename() {
    setConfirming(false);
    setDraft(conversation.title ?? '');
    setEditing(true);
  }

  function commitRename() {
    if (pending) return;
    const next = draft.trim();
    const current = (conversation.title ?? '').trim();
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
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  function cancelRename() {
    setEditing(false);
    setDraft('');
  }

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitRename();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelRename();
    }
  }

  function startDelete() {
    setEditing(false);
    setConfirming(true);
  }

  function cancelDelete() {
    setConfirming(false);
  }

  function confirmDelete() {
    if (pending) return;
    startTransition(async () => {
      const result = await deleteConversation(conversation.id);
      if ('error' in result) {
        toast.error(result.error);
        return;
      }
      toast.success('Conversation deleted.');
      router.refresh();
    });
  }

  const displayTitle = conversation.title ?? 'Untitled conversation';
  const dateStr = new Date(conversation.updated_at).toLocaleDateString('en', {
    month: 'short',
    day: 'numeric',
  });

  // Affordance overlay visibility:
  //   hidden + non-clickable by default
  //   visible on row hover (via `group` parent)
  //   sticky-visible whenever the delete confirm is mid-flow
  //   never visible when editing (the title cell holds the active surface)
  const affordanceClasses = confirming
    ? 'opacity-100 pointer-events-auto'
    : 'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto';

  // Inverse of `affordanceClasses` — cells that should fade out exactly when
  // the affordances fade in (hover OR confirming both count).
  const cellHideClasses = confirming
    ? 'opacity-0 transition-opacity'
    : 'transition-opacity group-hover:opacity-0';

  return (
    <div
      className="group relative lift-on-hover grid grid-cols-12 gap-3 items-baseline py-3"
      style={{ borderBottom: `1px solid ${tokens.surface}` }}
    >
      {/* Title cell — Link when idle, inline input when editing */}
      <div className="col-span-7">
        {editing ? (
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={onInputKeyDown}
            disabled={pending}
            placeholder="Untitled conversation"
            className="font-serif text-[19px] w-full bg-transparent"
            style={{
              fontWeight: 360,
              color: tokens.ink,
              outline: 'none',
              borderBottom: `1px solid ${tokens.hairline}`,
              paddingBottom: 2,
            }}
          />
        ) : (
          <Link
            href={`/develop/${conversation.id}`}
            className="font-serif text-[19px] leading-[1.3] block"
            style={{ fontWeight: 360, color: tokens.ink }}
          >
            {displayTitle}
          </Link>
        )}
      </div>

      {/* Status pill */}
      <div
        className="col-span-3 font-sans text-[10px] tracking-[0.16em] uppercase"
        style={{ color: statusColor(conversation.status) }}
      >
        {statusLabel(conversation.status)}
      </div>

      {/* Date — fades whenever affordances are visible (hover OR confirming) */}
      <div
        className={`col-span-1 font-mono text-[10px] text-right ${cellHideClasses}`}
        style={{ color: tokens.whisper }}
      >
        {dateStr}
      </div>

      {/* Chevron — same fade rule as the date cell */}
      <div
        className={`col-span-1 text-right ${cellHideClasses}`}
        style={{ color: tokens.whisper }}
      >
        <ChevronRight size={12} strokeWidth={1.5} />
      </div>

      {/* Hover-revealed action overlay (Rename + Delete or Confirm + Cancel) */}
      {!editing && (
        <div
          className={`absolute right-0 top-0 bottom-0 flex items-center gap-4 pr-2 transition-opacity ${affordanceClasses}`}
        >
          {confirming ? (
            <>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={pending}
                className="font-sans text-[10px] tracking-[0.22em] uppercase btn-quiet"
                style={{ color: tokens.terracotta }}
              >
                Confirm delete
              </button>
              <button
                type="button"
                onClick={cancelDelete}
                disabled={pending}
                className="font-sans text-[10px] tracking-[0.22em] uppercase btn-quiet"
                style={{ color: tokens.whisper }}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={startRename}
                disabled={pending}
                className="font-sans text-[10px] tracking-[0.22em] uppercase btn-quiet inline-flex items-center gap-1.5"
                style={{ color: tokens.ink }}
              >
                <Pencil size={11} strokeWidth={1.5} />
                Rename
              </button>
              <button
                type="button"
                onClick={startDelete}
                disabled={pending}
                className="font-sans text-[10px] tracking-[0.22em] uppercase btn-quiet inline-flex items-center gap-1.5"
                style={{ color: tokens.terracotta }}
              >
                <Trash2 size={11} strokeWidth={1.5} />
                Delete
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
