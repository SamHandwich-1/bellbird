import { tokens } from '@/lib/tokens';
import { IndicatorCell } from './IndicatorCell';
import type { IndicatorSnapshot } from '@/lib/supabase/cycles-queries';
import { CATEGORY_ORDER, CATEGORY_LABEL } from '@/lib/fred/series';
import type { IndicatorCategory } from '@/lib/types';

type Props = { snapshots: readonly IndicatorSnapshot[] };

export function MacroIndicatorGrid({ snapshots }: Props) {
  const byCategory = new Map<IndicatorCategory, IndicatorSnapshot[]>();
  for (const s of snapshots) {
    if (s.category === null) continue;
    const arr = byCategory.get(s.category) ?? [];
    arr.push(s);
    byCategory.set(s.category, arr);
  }

  return (
    <div className="mb-16">
      <div
        className="font-sans text-[10px] tracking-[0.22em] uppercase mb-6"
        style={{ color: tokens.whisper }}
      >
        Macro indicators
      </div>
      <div className="space-y-8">
        {CATEGORY_ORDER.map((cat) => {
          const items = byCategory.get(cat) ?? [];
          if (items.length === 0) return null;
          return (
            <div key={cat}>
              <div
                className="font-sans text-[10px] tracking-[0.16em] uppercase mb-3"
                style={{ color: tokens.fade }}
              >
                {CATEGORY_LABEL[cat]}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((s) => (
                  <IndicatorCell key={s.series_id} snapshot={s} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
