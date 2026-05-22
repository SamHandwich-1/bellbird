import { tokens } from '@/lib/tokens';
import type { MergedCycleReading } from '@/lib/types';
import { CycleGauge } from './CycleGauge';
import { CycleOverrideForm } from './CycleOverrideForm';
import { MacroIndicatorGrid } from './MacroIndicatorGrid';
import { BookDistribution } from './BookDistribution';
import { StageRotationMap } from './StageRotationMap';
import { LastRefreshed } from './LastRefreshed';
import type {
  BookDistribution as BookDistributionType,
  IndicatorSnapshot,
} from '@/lib/supabase/cycles-queries';

type Props = {
  readings: MergedCycleReading[];
  snapshots: IndicatorSnapshot[];
  distribution: BookDistributionType;
  lastRefreshed: string | null;
};

// Which series feeds the sparkline under each gauge.
const DRIVER_SERIES = {
  credit: 'BAMLH0A0HYM2',
  market: 'CAPE',
  juglar: 'TCU',
} as const;

const CYCLE_LABEL = {
  credit: 'Credit cycle',
  market: 'Market cycle',
  juglar: 'Juglar (capex)',
} as const;

export function CyclesScreen({ readings, snapshots, distribution, lastRefreshed }: Props) {
  const snapshotById = new Map(snapshots.map((s) => [s.series_id, s]));

  return (
    <div className="pt-12">
      <div className="mb-12">
        <div
          className="font-sans text-[10px] tracking-[0.22em] uppercase mb-2"
          style={{ color: tokens.whisper }}
        >
          Cycles
        </div>
        <h1
          className="font-serif text-[44px] tracking-tight"
          style={{ fontWeight: 340 }}
        >
          The three cycles
        </h1>
        <p
          className="font-serif text-[17px] leading-[1.55] mt-3"
          style={{ fontWeight: 340, color: tokens.ash, maxWidth: '62ch' }}
        >
          Credit leads, capex follows, equity reflects last. When all three peak together,
          it has historically preceded major drawdowns (1968, 2000, 2007). Watch the
          divergences as much as the levels.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
        {readings.map((r) => (
          <div key={r.cycle_name}>
            <CycleGauge
              name={CYCLE_LABEL[r.cycle_name]}
              reading={r}
              driver={snapshotById.get(DRIVER_SERIES[r.cycle_name]) ?? null}
            />
            <CycleOverrideForm reading={r} label={CYCLE_LABEL[r.cycle_name]} />
          </div>
        ))}
      </div>

      <div className="hairline mb-10" />

      <MacroIndicatorGrid snapshots={snapshots} />

      <div className="hairline mb-10" />

      <div className="mb-12">
        <div
          className="font-sans text-[10px] tracking-[0.22em] uppercase mb-6"
          style={{ color: tokens.whisper }}
        >
          Book distribution by cycle stage
        </div>
        <BookDistribution distribution={distribution} />
      </div>

      <div className="hairline mb-10" />

      <div className="mb-12">
        <StageRotationMap />
      </div>

      <div className="hairline mb-6" />

      <LastRefreshed lastRefreshed={lastRefreshed} />
    </div>
  );
}
