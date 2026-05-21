'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { tokens } from '@/lib/tokens';
import type { Thesis } from '@/lib/types';
import { TradeEntryModal, type TradePrefill } from './TradeEntryModal';

export function NewTradeButton({
  theses,
  prefill,
}: {
  theses: Pick<Thesis, 'id' | 'name'>[];
  prefill?: TradePrefill;
}) {
  const router = useRouter();
  // Auto-open when arriving from a deep-link with prefill params
  // (e.g. ?prefill_ticker=...&prefill_thesis_id=... from a library position).
  const [open, setOpen] = useState(prefill != null);

  function handleClose() {
    setOpen(false);
    // If we opened via deep-link, drop the prefill query params so a refresh
    // doesn't re-open the modal.
    if (prefill != null) {
      router.replace('/portfolio');
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-sans text-[10px] tracking-[0.22em] uppercase btn-quiet inline-flex items-center gap-2"
        style={{ color: tokens.ink }}
      >
        <Plus size={12} strokeWidth={1.5} /> New trade
      </button>
      {open && (
        <TradeEntryModal
          theses={theses}
          prefill={prefill}
          onClose={handleClose}
        />
      )}
    </>
  );
}
