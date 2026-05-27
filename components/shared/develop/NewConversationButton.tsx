'use client';

import { useTransition } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { tokens } from '@/lib/tokens';
import { startNewConversationAndRedirect } from '@/app/(app)/develop/actions';

export function NewConversationButton() {
  const [pending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      try {
        await startNewConversationAndRedirect();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Could not start conversation.');
      }
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="btn-quiet"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 14px',
        background: 'transparent',
        border: `1px solid ${tokens.chime}`,
        color: tokens.chime,
        cursor: pending ? 'wait' : 'pointer',
        fontFamily: 'JetBrains Mono, ui-monospace, monospace',
        fontSize: 10,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        opacity: pending ? 0.5 : 1,
      }}
    >
      <Plus size={11} strokeWidth={1.5} />
      {pending ? 'Starting' : 'New conversation'}
    </button>
  );
}
