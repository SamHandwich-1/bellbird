import { tokens } from '@/lib/tokens';
import type { Holding, Thesis } from '@/lib/types';
import { HoldingRow } from './HoldingRow';

export function HoldingsList({
  holdings,
  theses,
}: {
  holdings: Holding[];
  theses: Pick<Thesis, 'id' | 'name'>[];
}) {
  // Closed positions excluded from this table — they live in trade history.
  // Realized P&L from them surfaces in PortfolioSummary's "Realized" line.
  const open = holdings.filter((h) => h.net_quantity > 0);

  if (open.length === 0) {
    return (
      <p
        className="font-serif text-[17px] leading-[1.55] max-w-[58ch]"
        style={{ fontWeight: 340, color: tokens.ash }}
      >
        No open holdings yet. Click &ldquo;New trade&rdquo; to record your first buy.
      </p>
    );
  }

  const nameById = new Map(theses.map((t) => [t.id, t.name]));

  return (
    <section className="mb-16">
      <div className="hairline mb-6" />
      <div
        className="grid grid-cols-12 gap-3 font-sans text-[10px] tracking-[0.16em] uppercase py-3"
        style={{ color: tokens.fade }}
      >
        <div className="col-span-2">Ticker</div>
        <div className="col-span-4">Thesis</div>
        <div className="col-span-1 text-right">Weight</div>
        <div className="col-span-2 text-right">Entry</div>
        <div className="col-span-2 text-right">Current</div>
        <div className="col-span-1 text-right">P/L</div>
      </div>
      <div className="hairline" />
      {open.map((h) => (
        <HoldingRow
          key={h.ticker}
          holding={h}
          thesisName={h.thesis_id ? nameById.get(h.thesis_id) ?? null : null}
        />
      ))}
    </section>
  );
}
