'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { deleteThesis } from '@/app/(app)/library/actions';
import { tokens } from '@/lib/tokens';

export function DeleteThesisButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    startTransition(async () => {
      const result = await deleteThesis(id);
      if ('error' in result) {
        toast.error(result.error);
        return;
      }
      toast.success(`Deleted "${name}".`);
      router.push('/library');
    });
  }

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="font-sans text-[10px] tracking-[0.22em] uppercase btn-quiet inline-flex items-center gap-2"
        style={{ color: tokens.terracotta }}
      >
        <Trash2 size={12} strokeWidth={1.5} />
        {confirming ? 'Confirm delete' : 'Delete thesis'}
      </button>
      {confirming && (
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="font-sans text-[10px] tracking-[0.22em] uppercase btn-quiet"
          style={{ color: tokens.whisper }}
        >
          Cancel
        </button>
      )}
    </div>
  );
}
