'use client';

// Add-trigger button for the Library detail Triggers section. Thin wrapper
// around TriggerEntryModal — same pattern as NewTradeButton on Portfolio.

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { tokens } from '@/lib/tokens';
import { TriggerEntryModal } from './TriggerEntryModal';

export function AddTriggerButton({ thesisId }: { thesisId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="label btn-quiet"
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: tokens.chime,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: 0,
        }}
      >
        <Plus size={11} strokeWidth={2} />
        Add trigger
      </button>
      {open && (
        <TriggerEntryModal onClose={() => setOpen(false)} thesisId={thesisId} />
      )}
    </>
  );
}
