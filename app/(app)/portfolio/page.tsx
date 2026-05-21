import { tokens } from '@/lib/tokens';
import {
  getTrades,
  getCurrentPrices,
  getThesesForPortfolio,
} from '@/lib/supabase/portfolio-queries';
import {
  aggregateHoldings,
  summarisePortfolio,
  rollupByThesis,
} from '@/lib/portfolio/aggregate';
import { PortfolioSummary } from '@/components/portfolio/PortfolioSummary';
import { HoldingsList } from '@/components/portfolio/HoldingsList';
import { ThesisRollup } from '@/components/portfolio/ThesisRollup';
import { TradeHistoryTable } from '@/components/portfolio/TradeHistoryTable';
import { NewTradeButton } from '@/components/portfolio/NewTradeButton';
import { ExportCsvButton } from '@/components/portfolio/ExportCsvButton';
import type { TradePrefill } from '@/components/portfolio/TradeEntryModal';

type SearchParams = {
  prefill_ticker?: string;
  prefill_thesis_id?: string;
};

export default async function PortfolioPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const prefill: TradePrefill | undefined =
    params.prefill_ticker || params.prefill_thesis_id
      ? {
          ticker: params.prefill_ticker,
          thesis_id: params.prefill_thesis_id ?? null,
        }
      : undefined;

  const [trades, currentPrices, theses] = await Promise.all([
    getTrades(),
    getCurrentPrices(),
    getThesesForPortfolio(),
  ]);

  const holdings = aggregateHoldings(trades, currentPrices);
  const summary = summarisePortfolio(holdings);
  const rollups = rollupByThesis(holdings, theses);

  if (trades.length === 0) {
    return (
      <div className="pt-12">
        <div className="mb-8">
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
        </div>
        <p
          className="font-serif text-[17px] leading-[1.55] max-w-[58ch] mb-10"
          style={{ fontWeight: 340, color: tokens.ash }}
        >
          No trades yet. Click &ldquo;New trade&rdquo; to record your first buy.
          Holdings, P&amp;L, and per-thesis rollups all derive from your trade
          history.
        </p>
        <NewTradeButton theses={theses} prefill={prefill} />
      </div>
    );
  }

  return (
    <div className="pt-12">
      <PortfolioSummary summary={summary} />

      <div className="flex items-center gap-6 mb-12 flex-wrap">
        <NewTradeButton theses={theses} prefill={prefill} />
        <ExportCsvButton />
      </div>

      <HoldingsList holdings={holdings} theses={theses} />

      <ThesisRollup rollups={rollups} />

      <TradeHistoryTable trades={trades} theses={theses} />
    </div>
  );
}
