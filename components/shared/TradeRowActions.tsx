'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { tokens } from '@/lib/tokens';
import type { Thesis, Trade } from '@/lib/types';
import { deleteTrade } from '@/app/(app)/portfolio/actions';
import { TradeEntryModal } from './TradeEntryModal';

export function TradeRowActions({
  trade,
  theses,
}: {
  trade: Trade;
  theses: Pick<Thesis, 'id' | 'name'>[];
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function onDelete() {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000);
      return;
    }
    startTransition(async () => {
      const result = await deleteTrade(trade.id);
      if ('error' in result) {
        toast.error(result.error);
        return;
      }
      toast.success('Trade deleted.');
      setConfirming(false);
      router.refresh();
    });
  }

  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
      <button
        type="button"
        onClick={() => setEditOpen(true)}
        className="btn-quiet"
        aria-label="Edit trade"
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: tokens.muted,
          padding: 4,
        }}
      >
        <Pencil size={12} strokeWidth={1.5} />
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={pending}
        className="btn-quiet"
        aria-label={confirming ? 'Confirm delete' : 'Delete trade'}
        title={confirming ? 'Click again to confirm' : 'Delete'}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: pending ? 'wait' : 'pointer',
          color: confirming ? tokens.terracotta : tokens.muted,
          padding: 4,
          opacity: pending ? 0.5 : 1,
        }}
      >
        <Trash2 size={12} strokeWidth={1.5} />
      </button>
      {editOpen && (
        <TradeEntryModal
          theses={theses}
          initial={trade}
          onClose={() => setEditOpen(false)}
        />
      )}
    </div>
  );
}
