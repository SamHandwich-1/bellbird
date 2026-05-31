'use client';

// Edit + delete affordances appended to each TriggerDetailRow on Library
// detail. Watch is read-only and does not mount this — same separation as
// TradeRowActions on Portfolio.

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { tokens } from '@/lib/tokens';
import type { Trigger } from '@/lib/types';
import { deleteTrigger } from '@/app/(app)/library/[id]/actions';
import { TriggerEntryModal } from './TriggerEntryModal';

export function TriggerRowActions({ trigger }: { trigger: Trigger }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  function onDelete() {
    if (!confirm("Delete this trigger? This can't be undone.")) return;
    startTransition(async () => {
      const result = await deleteTrigger(trigger.id, trigger.thesis_id);
      if ('error' in result) {
        toast.error(result.error);
        return;
      }
      toast.success('Trigger deleted.');
      router.refresh();
    });
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <button
        type="button"
        onClick={() => setEditing(true)}
        disabled={pending}
        className="btn-quiet"
        aria-label="Edit trigger"
        style={{
          background: 'transparent',
          border: 'none',
          cursor: pending ? 'wait' : 'pointer',
          color: tokens.muted,
          padding: 4,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Pencil size={12} strokeWidth={1.5} />
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={pending}
        className="btn-quiet"
        aria-label="Delete trigger"
        style={{
          background: 'transparent',
          border: 'none',
          cursor: pending ? 'wait' : 'pointer',
          color: tokens.muted,
          padding: 4,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Trash2 size={12} strokeWidth={1.5} />
      </button>
      {editing && (
        <TriggerEntryModal
          onClose={() => setEditing(false)}
          thesisId={trigger.thesis_id}
          initial={trigger}
        />
      )}
    </div>
  );
}
