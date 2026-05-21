import { tokens } from '@/lib/tokens';
import type { PortfolioSummary as PortfolioSummaryType } from '@/lib/types';

function formatMoney(n: number): string {
  const rounded = Math.round(n);
  return `$${rounded.toLocaleString('en-AU')}`;
}

export function PortfolioSummary({ summary }: { summary: PortfolioSummaryType }) {
  const blendedColor =
    summary.blended_return_pct >= 0 ? tokens.sage : tokens.terracotta;
  const blendedSign = summary.blended_return_pct >= 0 ? '+' : '';

  const realizedColor =
    summary.total_realized_pnl >= 0 ? tokens.sage : tokens.terracotta;
  const realizedSign = summary.total_realized_pnl >= 0 ? '+' : '';

  return (
    <div className="flex items-baseline justify-between mb-12 flex-wrap gap-4">
      <div>
        <div
          className="font-sans text-[10px] tracking-[0.22em] uppercase mb-2"
          style={{ color: tokens.whisper }}
        >
          Portfolio
        </div>
        <h1
          className="font-serif text-[44px] tracking-tight"
          style={{ fontWeight: 340 }}
        >
          Active positions
        </h1>
        <div className="mt-2 font-sans text-[12px]" style={{ color: tokens.ash }}>
          <span className="font-mono">{summary.holding_count}</span> position
          {summary.holding_count === 1 ? '' : 's'} across{' '}
          <span className="font-mono">{summary.thesis_count}</span> thes
          {summary.thesis_count === 1 ? 'is' : 'es'}
        </div>
      </div>
      <div className="text-right">
        <div
          className="font-sans text-[10px] tracking-[0.22em] uppercase mb-1"
          style={{ color: tokens.whisper }}
        >
          Blended return
        </div>
        <div
          className="font-mono text-[36px] leading-none"
          style={{ color: blendedColor, fontWeight: 500 }}
        >
          {blendedSign}
          {summary.blended_return_pct.toFixed(2)}%
        </div>
        {summary.total_realized_pnl !== 0 && (
          <div
            className="mt-2 font-sans text-[10px] tracking-[0.16em] uppercase"
            style={{ color: tokens.whisper }}
          >
            Realized{' '}
            <span className="font-mono" style={{ color: realizedColor }}>
              {realizedSign}
              {formatMoney(Math.abs(summary.total_realized_pnl))}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
