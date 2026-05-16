'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { EditThesisModal } from './EditThesisModal';
import { tokens } from '@/lib/tokens';

export function NewThesisButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-sans text-[10px] tracking-[0.22em] uppercase btn-quiet inline-flex items-center gap-2"
        style={{ color: tokens.ink }}
      >
        <Plus size={12} strokeWidth={1.5} /> New thesis
      </button>
      {open && <EditThesisModal onClose={() => setOpen(false)} />}
    </>
  );
}
