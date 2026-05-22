import { tokens, cycleStageColor, formatStage } from '@/lib/tokens';
import type { CycleStage } from '@/lib/types';
import type { BookDistribution as BookDistributionType } from '@/lib/supabase/cycles-queries';

const ROW_LABEL: Record<CycleStage, string> = {
  secular: 'Survives cycle drawdowns',
  'mid-cycle': 'Active alpha now',
  'long-cycle': 'Multi-decade horizon',
  'narrative-cycle': 'Pre-committed exits',
  'credit-cycle': 'Stage 1 — close before Stage 2',
};

const ROW_ORDER: readonly CycleStage[] = [
  'secular',
  'mid-cycle',
  'long-cycle',
  'narrative-cycle',
  'credit-cycle',
] as const;

type Props = { distribution: BookDistributionType };

export function BookDistribution({ distribution }: Props) {
  const total = distribution.total;
  if (total === 0) {
    return (
      <p
        className="font-sans text-[12px] italic"
        style={{ color: tokens.ash }}
      >
        No theses in the library yet — book distribution will appear once theses are added.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {ROW_ORDER.map((stage) => {
        const count = distribution.bystage[stage];
        if (count === 0) return null;
        const pct = (count / total) * 100;
        const color = cycleStageColor(stage);
        return (
          <div key={stage} className="grid grid-cols-12 items-center gap-3">
            <div
              className="col-span-3 font-sans text-[11px] tracking-[0.16em] uppercase"
              style={{ color }}
            >
              {formatStage(stage)}
            </div>
            <div
              className="col-span-1 font-mono nums text-[12px]"
              style={{ color: tokens.ink }}
            >
              {count}
            </div>
            <div
              className="col-span-5"
              style={{ height: 2, background: tokens.surface, position: 'relative' }}
            >
              <div style={{ height: 2, width: `${pct}%`, background: color }} />
            </div>
            <div
              className="col-span-3 font-serif text-[11px] italic"
              style={{ color: tokens.ash, fontWeight: 340 }}
            >
              {ROW_LABEL[stage]}
            </div>
          </div>
        );
      })}
      {distribution.bystage.unset > 0 && (
        <div
          className="font-sans text-[10px] mt-3 italic"
          style={{ color: tokens.fade }}
        >
          {distribution.bystage.unset} thes
          {distribution.bystage.unset === 1 ? 'is' : 'es'} without a cycle stage set.
        </div>
      )}
    </div>
  );
}
