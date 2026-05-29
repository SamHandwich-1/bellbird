import Link from 'next/link';
import { tokens } from '@/lib/tokens';
import { getMergedCycleReadings } from '@/lib/supabase/cycles-queries';
import { PlannedSection } from '@/components/shared/PlannedSection';
import { CycleGaugeBare } from '@/components/shared/CycleGaugeBare';
import { CycleOverrideForm } from '@/components/shared/CycleOverrideForm';
import type { CycleName, MergedCycleReading } from '@/lib/types';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ tab?: string }>;

type CycleSlot =
  | { kind: 'live'; cycle: CycleName; label: string }
  | { kind: 'planned'; label: string };

// Render order matches references/bellbird-mockup-v2-cycles.jsx. The three
// 'live' slots are backed by cycle_overrides + cycle_readings. The two
// 'planned' slots ship em-dashed until the schema extends for them.
const CYCLE_SLOTS: CycleSlot[] = [
  { kind: 'live', cycle: 'market', label: 'Market cycle' },
  { kind: 'live', cycle: 'credit', label: 'Credit cycle' },
  { kind: 'live', cycle: 'juglar', label: 'Juglar / capex' },
  { kind: 'planned', label: 'Rate cycle' },
  { kind: 'planned', label: 'Narrative / sentiment' },
];

export default async function CyclesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const tab = params.tab === 'history' ? 'history' : 'now';
  const readings = await getMergedCycleReadings();
  const readingByName = new Map(readings.map((r) => [r.cycle_name, r]));

  return (
    <div>
      <PageHeader />
      <SubTabs active={tab} />
      {tab === 'now' ? <NowView readings={readingByName} /> : <HistoryView />}
    </div>
  );
}

function PageHeader() {
  return (
    <div style={{ marginBottom: 24, paddingTop: 12 }}>
      <div className="label" style={{ color: tokens.muted, marginBottom: 6 }}>
        Macro reading
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <h1
          className="serif"
          style={{
            fontSize: 36,
            fontWeight: 600,
            letterSpacing: '-0.02em',
            color: tokens.text,
            margin: 0,
            lineHeight: 1.1,
          }}
        >
          Cycles
        </h1>
        <div
          className="mono nums"
          style={{
            fontSize: 10.5,
            color: tokens.faint,
            letterSpacing: '0.08em',
          }}
        >
          UPDATED —
        </div>
      </div>
    </div>
  );
}

function SubTabs({ active }: { active: 'now' | 'history' }) {
  const tabs: Array<{ id: 'now' | 'history'; label: string; sub: string }> = [
    { id: 'now', label: 'Now', sub: 'Current cycle gauges' },
    { id: 'history', label: 'History', sub: 'Multi-signal percentile chart, 1970–now' },
  ];
  return (
    <div
      style={{
        borderBottom: `1px solid ${tokens.line}`,
        marginBottom: 40,
        display: 'flex',
        gap: 40,
      }}
    >
      {tabs.map((t) => {
        const isActive = active === t.id;
        const href = t.id === 'now' ? '/cycles' : `/cycles?tab=${t.id}`;
        return (
          <Link
            key={t.id}
            href={href}
            className="btn-quiet"
            style={{
              paddingBottom: 14,
              textDecoration: 'none',
              borderBottom: isActive
                ? `1.5px solid ${tokens.chime}`
                : '1.5px solid transparent',
              marginBottom: -1,
            }}
          >
            <div
              className="serif"
              style={{
                fontSize: 17,
                fontWeight: 600,
                letterSpacing: '-0.01em',
                color: isActive ? tokens.text : tokens.muted,
              }}
            >
              {t.label}
            </div>
            <div
              className="mono"
              style={{
                fontSize: 10,
                color: tokens.faint,
                letterSpacing: '0.04em',
                marginTop: 3,
              }}
            >
              {t.sub}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function NowView({ readings }: { readings: Map<CycleName, MergedCycleReading> }) {
  const liveCount = CYCLE_SLOTS.filter(
    (s) => s.kind === 'live' && readings.has(s.cycle),
  ).length;

  return (
    <div>
      <PlannedSection
        label="Synthesis"
        sub={`Composite read across all five cycles, headline "X/5 in late or peak" tally, and convergence prose. Lands when numeric cycle readings ship.`}
      />
      <PlannedSection
        label="Convergence map"
        sub="All five cycles on a single phase track. Lights up when cycle readings are numeric."
      />

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 4,
          paddingBottom: 10,
          borderBottom: `1px solid ${tokens.line}`,
        }}
      >
        <span className="label" style={{ color: tokens.text }}>
          The gauges
        </span>
        <span
          className="mono"
          style={{ fontSize: 10, color: tokens.faint, letterSpacing: '0.06em' }}
        >
          5 CYCLES · {liveCount} LIVE
        </span>
      </div>

      <div style={{ marginBottom: 56 }}>
        {CYCLE_SLOTS.map((slot, i) => {
          if (slot.kind === 'planned') {
            return (
              <CycleGaugeBare
                key={`planned-${i}`}
                name={slot.label}
                phase={null}
                status={null}
                detailProse={null}
              />
            );
          }
          const reading = readings.get(slot.cycle);
          if (!reading) {
            return (
              <CycleGaugeBare
                key={slot.cycle}
                name={slot.label}
                phase={null}
                status={null}
                detailProse={null}
              />
            );
          }
          return (
            <CycleGaugeBare
              key={slot.cycle}
              name={slot.label}
              phase={reading.reading || null}
              status={reading.status}
              detailProse={reading.detail}
            >
              <CycleOverrideForm reading={reading} label={slot.label} />
            </CycleGaugeBare>
          );
        })}
      </div>

      <PlannedSection
        label="Historical parallels"
        sub="Multi-cycle convergence precedents (1968–69, 2000, 2007). Lands when the cycle readings the analogs are read against exist."
      />
    </div>
  );
}

function HistoryView() {
  return (
    <PlannedSection
      label="Cycle history"
      sub="Percentile bands, 56-year backtest with regime overlay. Lands when FRED wiring ships."
    />
  );
}
