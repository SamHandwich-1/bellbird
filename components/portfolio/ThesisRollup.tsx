import { tokens } from '@/lib/tokens';
import type { ThesisPerformance } from '@/lib/types';

function formatMoney(n: number): string {
  return `$${Math.round(n).toLocaleString('en-AU')}`;
}

export function ThesisRollup({ rollups }: { rollups: ThesisPerformance[] }) {
  if (rollups.length === 0) return null;

  return (
    <section className="mb-16">
      <div
        className="font-sans text-[10px] tracking-[0.22em] uppercase mb-6"
        style={{ color: tokens.whisper }}
      >
        Performance by thesis
      </div>
      <div
        className="grid grid-cols-12 gap-3 font-sans text-[10px] tracking-[0.16em] uppercase py-3"
        style={{ color: tokens.fade }}
      >
        <div className="col-span-6">Thesis</div>
        <div className="col-span-2 text-right">Cost</div>
        <div className="col-span-2 text-right">Value</div>
        <div className="col-span-2 text-right">P/L</div>
      </div>
      <div className="hairline" />
      {rollups.map((r) => (
        <ThesisRollupRow key={r.thesis_id ?? '__none__'} rollup={r} />
      ))}
    </section>
  );
}

function ThesisRollupRow({ rollup }: { rollup: ThesisPerformance }) {
  const pnlAbs = rollup.total_unrealized_pnl;
  const pnlPct =
    rollup.total_cost_basis > 0 ? (pnlAbs / rollup.total_cost_basis) * 100 : 0;
  const color = pnlAbs >= 0 ? tokens.sage : tokens.terracotta;
  const sign = pnlAbs >= 0 ? '+' : '';

  return (
    <div
      className="grid grid-cols-12 gap-3 items-baseline py-3"
      style={{ borderBottom: `1px solid ${tokens.surface}` }}
    >
      <div className="col-span-6">
        <div
          className="font-serif text-[16px]"
          style={{ fontWeight: 360, color: tokens.ink }}
        >
          {rollup.thesis_name ?? 'Unassigned'}
        </div>
        <div
          className="font-sans text-[10px] tracking-[0.06em] mt-1"
          style={{ color: tokens.whisper }}
        >
          <span className="font-mono">{rollup.holdings.length}</span> position
          {rollup.holdings.length === 1 ? '' : 's'}
        </div>
      </div>
      <div
        className="col-span-2 font-mono text-[12px] text-right"
        style={{ color: tokens.whisper }}
      >
        {formatMoney(rollup.total_cost_basis)}
      </div>
      <div
        className="col-span-2 font-mono text-[12px] text-right"
        style={{ color: tokens.ink }}
      >
        {formatMoney(rollup.total_current_value)}
      </div>
      <div
        className="col-span-2 font-mono text-[13px] text-right"
        style={{ color, fontWeight: 500 }}
      >
        {sign}
        {pnlPct.toFixed(1)}%
      </div>
    </div>
  );
}
