'use client';

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { EditThesisModal } from './EditThesisModal';
import { tokens } from '@/lib/tokens';
import type { Thesis } from '@/lib/types';

export function EditThesisTrigger({ thesis }: { thesis: Thesis }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-sans text-[10px] tracking-[0.22em] uppercase btn-quiet inline-flex items-center gap-2"
        style={{ color: tokens.ink }}
      >
        <Pencil size={12} strokeWidth={1.5} /> Edit thesis
      </button>
      {open && <EditThesisModal initial={thesis} onClose={() => setOpen(false)} />}
    </>
  );
}
