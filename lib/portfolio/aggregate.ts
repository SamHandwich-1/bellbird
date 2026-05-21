import type {
  Trade,
  CurrentPrice,
  Holding,
  Thesis,
  ThesisPerformance,
  PortfolioSummary,
} from '@/lib/types';

// =============================================================================
// Trade -> Holding aggregation
//
// Cost-basis method: AVERAGE COST.
//
//   Buy:  cost_basis += qty * price + fees
//         net_qty    += qty
//         avg_cost   = cost_basis / net_qty
//
//   Sell: realized_pnl += (sell_price - avg_cost) * qty − fees
//         cost_basis   -= avg_cost * qty
//         net_qty      -= qty
//         avg_cost stays the same
//
// Trades are processed in chronological order per ticker; order matters for
// the sell math.
//
// FIFO/LIFO are deferred (v1.x candidate) — flagged for if/when ATO-aligned
// reporting becomes a requirement. Today's tax records live in IBKR exports.
// =============================================================================

export function aggregateHolding(
  tradesForTicker: Trade[],
  currentPrice: number | null,
): Holding {
  if (tradesForTicker.length === 0) {
    return emptyHolding('', null, null);
  }

  const ticker = tradesForTicker[0].ticker;

  // Process trades chronologically by user-declared date (executed_at). When
  // multiple trades share the same date — common when entered in one sitting —
  // fall back to created_at (insertion timestamp) so the order matches how the
  // user entered them. Final fallback to id keeps the sort deterministic if two
  // rows somehow share both timestamps to the millisecond.
  const sorted = [...tradesForTicker].sort((a, b) => {
    const tCmp =
      new Date(a.executed_at).getTime() - new Date(b.executed_at).getTime();
    if (tCmp !== 0) return tCmp;
    const cCmp =
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (cCmp !== 0) return cCmp;
    return a.id.localeCompare(b.id);
  });

  let netQuantity = 0;
  let costBasis = 0;
  let realizedPnl = 0;
  // Lifetime buy-side cost basis. Never reduced by sells. Used to anchor
  // realized% when all positions close out.
  let totalPurchasedCostBasis = 0;
  let lastThesisId: string | null = null;

  for (const t of sorted) {
    if (t.thesis_id != null) lastThesisId = t.thesis_id;

    if (t.side === 'buy') {
      const buyCost = t.quantity * t.price + (t.fees ?? 0);
      costBasis += buyCost;
      totalPurchasedCostBasis += buyCost;
      netQuantity += t.quantity;
    } else {
      // sell
      const avgCostNow = netQuantity > 0 ? costBasis / netQuantity : 0;
      const sellRevenue = t.quantity * t.price - (t.fees ?? 0);
      const sellCost = avgCostNow * t.quantity;
      realizedPnl += sellRevenue - sellCost;
      costBasis = Math.max(0, costBasis - sellCost);
      netQuantity -= t.quantity;
    }
  }

  const avgCost = netQuantity > 0 ? costBasis / netQuantity : 0;

  let currentValue: number | null = null;
  let unrealizedPnl: number | null = null;
  let unrealizedPnlPct: number | null = null;

  if (currentPrice != null && netQuantity > 0) {
    currentValue = netQuantity * currentPrice;
    unrealizedPnl = currentValue - costBasis;
    unrealizedPnlPct =
      costBasis > 0 ? (unrealizedPnl / costBasis) * 100 : null;
  }

  return {
    ticker,
    net_quantity: netQuantity,
    cost_basis: costBasis,
    avg_cost: avgCost,
    realized_pnl: realizedPnl,
    total_purchased_cost_basis: totalPurchasedCostBasis,
    thesis_id: lastThesisId,
    current_price: currentPrice,
    current_value: currentValue,
    unrealized_pnl: unrealizedPnl,
    unrealized_pnl_pct: unrealizedPnlPct,
    weight_pct: 0, // filled by aggregateHoldings
  };
}

function emptyHolding(
  ticker: string,
  thesisId: string | null,
  currentPrice: number | null,
): Holding {
  return {
    ticker,
    net_quantity: 0,
    cost_basis: 0,
    avg_cost: 0,
    realized_pnl: 0,
    total_purchased_cost_basis: 0,
    thesis_id: thesisId,
    current_price: currentPrice,
    current_value: null,
    unrealized_pnl: null,
    unrealized_pnl_pct: null,
    weight_pct: 0,
  };
}

export function aggregateHoldings(
  allTrades: Trade[],
  currentPrices: CurrentPrice[],
): Holding[] {
  // Group trades by ticker
  const byTicker = new Map<string, Trade[]>();
  for (const t of allTrades) {
    const list = byTicker.get(t.ticker) ?? [];
    list.push(t);
    byTicker.set(t.ticker, list);
  }

  // Index current prices
  const priceByTicker = new Map<string, number>();
  for (const p of currentPrices) priceByTicker.set(p.ticker, p.price);

  // Aggregate each
  const holdings: Holding[] = [];
  for (const [ticker, trades] of byTicker) {
    const price = priceByTicker.get(ticker) ?? null;
    holdings.push(aggregateHolding(trades, price));
  }

  // Compute weight_pct based on cost basis. Open positions only — closed
  // positions (net_quantity = 0) contribute nothing to current allocation.
  const totalOpenCostBasis = holdings
    .filter((h) => h.net_quantity > 0)
    .reduce((s, h) => s + h.cost_basis, 0);

  for (const h of holdings) {
    h.weight_pct =
      totalOpenCostBasis > 0 && h.net_quantity > 0
        ? (h.cost_basis / totalOpenCostBasis) * 100
        : 0;
  }

  // Sort: open positions first (by descending cost basis), then closed
  holdings.sort((a, b) => {
    const aOpen = a.net_quantity > 0 ? 1 : 0;
    const bOpen = b.net_quantity > 0 ? 1 : 0;
    if (aOpen !== bOpen) return bOpen - aOpen;
    return b.cost_basis - a.cost_basis;
  });

  return holdings;
}

// =============================================================================
// Portfolio-level + per-thesis rollups
// =============================================================================

export function summarisePortfolio(holdings: Holding[]): PortfolioSummary {
  const open = holdings.filter((h) => h.net_quantity > 0);
  const totalCost = open.reduce((s, h) => s + h.cost_basis, 0);
  const totalValue = open.reduce((s, h) => s + (h.current_value ?? 0), 0);
  const totalUnrealized = open.reduce(
    (s, h) => s + (h.unrealized_pnl ?? 0),
    0,
  );
  const totalRealized = holdings.reduce((s, h) => s + h.realized_pnl, 0);

  // Blended return: unrealized% on open positions when any exist. When all
  // positions are closed out but realized P/L is non-zero, fall back to
  // realized% of lifetime capital deployed on the closed positions — otherwise
  // we'd display "+0.00%" while sitting on real banked profit (the bug found
  // during verification).
  let blendedReturnPct = 0;
  if (totalCost > 0) {
    blendedReturnPct = (totalUnrealized / totalCost) * 100;
  } else if (totalRealized !== 0) {
    const closedPurchased = holdings
      .filter((h) => h.net_quantity === 0)
      .reduce((s, h) => s + h.total_purchased_cost_basis, 0);
    if (closedPurchased > 0) {
      blendedReturnPct = (totalRealized / closedPurchased) * 100;
    }
  }

  const thesisIds = new Set(
    open.filter((h) => h.thesis_id != null).map((h) => h.thesis_id as string),
  );

  return {
    holding_count: open.length,
    thesis_count: thesisIds.size,
    total_cost_basis: totalCost,
    total_current_value: totalValue,
    total_unrealized_pnl: totalUnrealized,
    total_realized_pnl: totalRealized,
    blended_return_pct: blendedReturnPct,
  };
}

export function rollupByThesis(
  holdings: Holding[],
  theses: Pick<Thesis, 'id' | 'name'>[],
): ThesisPerformance[] {
  const nameById = new Map<string, string>();
  for (const t of theses) nameById.set(t.id, t.name);

  // Group open holdings by thesis_id (closed positions excluded from rollup —
  // they have realized P&L only; we surface that at the top-line summary).
  const byThesis = new Map<string | null, Holding[]>();
  for (const h of holdings) {
    if (h.net_quantity <= 0) continue;
    const key = h.thesis_id ?? null;
    const list = byThesis.get(key) ?? [];
    list.push(h);
    byThesis.set(key, list);
  }

  const rollups: ThesisPerformance[] = [];
  for (const [thesisId, hs] of byThesis) {
    rollups.push({
      thesis_id: thesisId,
      thesis_name: thesisId == null ? null : nameById.get(thesisId) ?? thesisId,
      holdings: hs,
      total_cost_basis: hs.reduce((s, h) => s + h.cost_basis, 0),
      total_current_value: hs.reduce((s, h) => s + (h.current_value ?? 0), 0),
      total_unrealized_pnl: hs.reduce((s, h) => s + (h.unrealized_pnl ?? 0), 0),
      total_realized_pnl: hs.reduce((s, h) => s + h.realized_pnl, 0),
    });
  }

  // Sort: by descending cost basis, with the null-thesis bucket pinned last.
  rollups.sort((a, b) => {
    if (a.thesis_id == null && b.thesis_id != null) return 1;
    if (b.thesis_id == null && a.thesis_id != null) return -1;
    return b.total_cost_basis - a.total_cost_basis;
  });

  return rollups;
}
