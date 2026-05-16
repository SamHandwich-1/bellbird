'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';
import { seedLibrary } from '@/app/(app)/library/seed-action';
import { tokens } from '@/lib/tokens';

export function SeedLibraryButton() {
  const [pending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      const result = await seedLibrary();
      if ('error' in result) {
        toast.error(result.error);
        return;
      }
      toast.success(
        `Seeded ${result.theses} theses and ${result.positions} positions.`,
      );
    });
  }

  return (
    <div
      className="mt-10 p-8"
      style={{
        background: tokens.mist,
        border: `1px solid ${tokens.hairline}`,
      }}
    >
      <div
        className="font-sans text-[10px] tracking-[0.22em] uppercase mb-3"
        style={{ color: tokens.whisper }}
      >
        Empty library
      </div>
      <h2
        className="font-serif text-[24px] tracking-tight mb-3"
        style={{ fontWeight: 380 }}
      >
        Start with the 19 seeded theses
      </h2>
      <p
        className="font-serif text-[15px] leading-[1.55] mb-6 max-w-[58ch]"
        style={{ fontWeight: 340, color: tokens.ash }}
      >
        Imports the current 19-thesis book from <span className="font-mono text-[13px]">references/theses-book.jsx</span>{' '}
        with all positions. One-shot, idempotent — runs once, then this card disappears.
      </p>
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="font-sans text-[10px] tracking-[0.22em] uppercase btn-quiet inline-flex items-center gap-2"
        style={{
          color: tokens.chime,
          borderBottom: `1px solid ${tokens.chime}`,
          paddingBottom: 4,
          opacity: pending ? 0.5 : 1,
        }}
      >
        <Sparkles size={12} strokeWidth={1.5} />
        {pending ? 'Seeding' : 'Seed library'}
      </button>
    </div>
  );
}
