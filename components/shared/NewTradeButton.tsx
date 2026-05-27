'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { tokens } from '@/lib/tokens';
import type { Thesis } from '@/lib/types';
import { TradeEntryModal } from './TradeEntryModal';

export function NewTradeButton({
  theses,
}: {
  theses: Pick<Thesis, 'id' | 'name'>[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-quiet"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 14px',
          background: 'transparent',
          border: `1px solid ${tokens.chime}`,
          color: tokens.chime,
          cursor: 'pointer',
          fontFamily: 'JetBrains Mono, ui-monospace, monospace',
          fontSize: 10,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
        }}
      >
        <Plus size={11} strokeWidth={1.5} />
        New trade
      </button>
      {open && (
        <TradeEntryModal theses={theses} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
