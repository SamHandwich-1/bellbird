'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { tokens } from '@/lib/tokens';

export type ViewKey = 'all' | 'portfolio' | 'watchlist';

const VIEWS: Array<{ id: ViewKey; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'portfolio', label: 'In portfolio' },
  { id: 'watchlist', label: 'Watchlist' },
];

export function ViewFilter({
  counts,
  active,
}: {
  counts: Record<ViewKey, number>;
  active: ViewKey;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setView(view: ViewKey) {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    if (view === 'all') params.delete('view');
    else params.set('view', view);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="flex items-center gap-5 mb-6 flex-wrap">
      <span
        className="font-sans text-[10px] tracking-[0.22em] uppercase"
        style={{ color: tokens.fade }}
      >
        Show
      </span>
      {VIEWS.map((v) => {
        const isActive = active === v.id;
        return (
          <button
            key={v.id}
            type="button"
            onClick={() => setView(v.id)}
            className="font-sans text-[10px] tracking-[0.16em] uppercase btn-quiet"
            style={{
              color: isActive ? tokens.ink : tokens.whisper,
              borderBottom: isActive
                ? `1px solid ${tokens.ink}`
                : '1px solid transparent',
              paddingBottom: 3,
            }}
          >
            {v.label} <span className="font-mono ml-1">{counts[v.id] ?? 0}</span>
          </button>
        );
      })}
    </div>
  );
}
