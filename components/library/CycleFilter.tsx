'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { cycleStageColor, formatStage, tokens } from '@/lib/tokens';
import type { CycleStage } from '@/lib/types';

type Counts = Record<CycleStage | 'all', number>;

const STAGES: Array<CycleStage | 'all'> = [
  'all',
  'secular',
  'long-cycle',
  'mid-cycle',
  'credit-cycle',
  'narrative-cycle',
];

export function CycleFilter({ counts, active }: { counts: Counts; active: CycleStage | 'all' }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setStage(stage: CycleStage | 'all') {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    if (stage === 'all') params.delete('stage');
    else params.set('stage', stage);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="flex items-center gap-4 mb-10 flex-wrap">
      <span
        className="font-sans text-[10px] tracking-[0.22em] uppercase"
        style={{ color: tokens.fade }}
      >
        Stage
      </span>
      {STAGES.map((s) => {
        const isActive = active === s;
        const color = s === 'all' ? tokens.ink : cycleStageColor(s);
        return (
          <button
            key={s}
            type="button"
            onClick={() => setStage(s)}
            className="font-sans text-[10px] tracking-[0.16em] uppercase btn-quiet"
            style={{
              color: isActive ? color : tokens.whisper,
              borderBottom: isActive ? `1px solid ${color}` : '1px solid transparent',
              paddingBottom: 3,
            }}
          >
            {s === 'all' ? 'All' : formatStage(s)}{' '}
            <span className="font-mono ml-1">{counts[s] ?? 0}</span>
          </button>
        );
      })}
    </div>
  );
}
