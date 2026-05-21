'use client';

import { Pencil } from 'lucide-react';
import { tokens } from '@/lib/tokens';

// Tiny presentation button. State (the actual modal) lives in the parent row.
export function EditTradeButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="font-sans text-[10px] tracking-[0.22em] uppercase btn-quiet inline-flex items-center gap-1.5"
      style={{ color: tokens.ink }}
    >
      <Pencil size={11} strokeWidth={1.5} />
      Edit
    </button>
  );
}
