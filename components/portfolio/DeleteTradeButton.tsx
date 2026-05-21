'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { tokens } from '@/lib/tokens';
import { deleteTrade } from '@/app/(app)/portfolio/actions';

// Two-stage confirm pattern, same shape as DeleteThesisButton and
// ConversationListRow's delete. Owns its own confirming state internally,
// but emits onConfirmingChange so the parent row can keep its cellHideClasses
// sticky for as long as confirming is true.
export function DeleteTradeButton({
  tradeId,
  onConfirmingChange,
}: {
  tradeId: string;
  onConfirmingChange?: (confirming: boolean) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirmingState] = useState(false);

  function setConfirming(value: boolean) {
    setConfirmingState(value);
    onConfirmingChange?.(value);
  }

  function startDelete() {
    setConfirming(true);
  }
  function cancelDelete() {
    setConfirming(false);
  }
  function confirmDelete() {
    if (pending) return;
    startTransition(async () => {
      const result = await deleteTrade(tradeId);
      if ('error' in result) {
        toast.error(result.error);
        return;
      }
      toast.success('Trade deleted.');
      setConfirming(false);
      router.refresh();
    });
  }

  if (confirming) {
    return (
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
    );
  }

  return (
    <button
      type="button"
      onClick={startDelete}
      className="font-sans text-[10px] tracking-[0.22em] uppercase btn-quiet inline-flex items-center gap-1.5"
      style={{ color: tokens.terracotta }}
    >
      <Trash2 size={11} strokeWidth={1.5} />
      Delete
    </button>
  );
}
