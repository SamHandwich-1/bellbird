'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { createConversation } from '@/app/(app)/develop/actions';
import { tokens } from '@/lib/tokens';

export function NewConversationButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      const result = await createConversation();
      if ('error' in result) {
        toast.error(result.error);
        return;
      }
      router.push(`/develop/${result.id}`);
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="font-sans text-[10px] tracking-[0.22em] uppercase btn-quiet inline-flex items-center gap-2"
      style={{
        color: tokens.ink,
        opacity: pending ? 0.5 : 1,
      }}
    >
      <Plus size={12} strokeWidth={1.5} /> {pending ? 'Starting' : 'Start a new conversation'}
    </button>
  );
}
