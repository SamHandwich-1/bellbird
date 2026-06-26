export type CycleStage =
  | 'secular'
  | 'long-cycle'
  | 'mid-cycle'
  | 'credit-cycle'
  | 'narrative-cycle';

export type ThesisStatus = 'active' | 'watching' | 'closed';
export type PositionSide = 'long' | 'short' | 'hedge';
export type TradeSide = 'buy' | 'sell';
export type Verdict = 'PROCEED' | 'STRESS_TEST' | 'CLARIFY' | 'DISCARD';
export type ConversationStatus =
  | 'open'
  | 'phase_2'
  | 'phase_3'
  | 'phase_4'
  | 'completed'
  | 'discarded';
export type MessageRole = 'user' | 'assistant';
export type CycleName = 'credit' | 'market' | 'juglar';
export type CycleStatus = 'healthy' | 'caution' | 'alert';
export type IndicatorCategory =
  | 'real_economy'
  | 'rates'
  | 'liquidity'
  | 'credit'
  | 'capex'
  | 'equity_valuation'
  | 'sentiment';
export type TriggerType = 'confirming' | 'disconfirming' | 'kill-on-sight';
export type TriggerStatus = 'armed' | 'fired' | 'disarmed';

export interface Thesis {
  id: string;
  name: string;
  sector: string | null;
  conviction: number;
  timing: string | null;
  status: ThesisStatus;
  cycle_stage: CycleStage | null;
  summary: string | null;
  hedge_note: string | null;
  in_portfolio: boolean;
  created_at: string;
  updated_at: string;
}

export interface Position {
  id: string;
  thesis_id: string;
  ticker: string;
  name: string;
  weight: number;
  side: PositionSide;
  valuation: string | null;
  upside: number | null;
  notes: string | null;
  position_order: number | null;
  created_at: string;
}

export interface Trade {
  id: string;
  thesis_id: string | null;
  ticker: string;
  side: TradeSide;
  quantity: number;
  price: number;
  currency: string;
  fees: number;
  executed_at: string;
  notes: string | null;
  created_at: string;
}

// Manual current price (per ticker). Source-of-truth for the "Current" column
// in the Portfolio holdings view until Polygon live prices land in v1.2.
export interface CurrentPrice {
  ticker: string;
  price: number;
  currency: string;
  updated_at: string;
}

// Derived view — one Holding per ticker, computed from the chronological trade
// sequence + the manual current price. NOT stored in the DB. See
// lib/portfolio/aggregate.ts for the computation.
export interface Holding {
  ticker: string;
  // Trade-derived
  net_quantity: number;          // sum(buys.qty) − sum(sells.qty)
  cost_basis: number;            // remaining cost basis after avg-cost sell reductions
  avg_cost: number;              // cost_basis ÷ net_quantity (the "Entry" column)
  realized_pnl: number;          // accumulated over historical sells
  // Lifetime sum of buy-side cost basis on this ticker — never reduced by sells.
  // Used by summarisePortfolio to compute realized% when all positions are closed.
  total_purchased_cost_basis: number;
  // Most-recent thesis_id seen on this ticker's trades. Null if no trade ever
  // linked the ticker to a thesis.
  thesis_id: string | null;
  // Current-price-derived (null when no current price has been set)
  current_price: number | null;
  current_value: number | null;
  unrealized_pnl: number | null;       // absolute, AUD
  unrealized_pnl_pct: number | null;   // percent of cost_basis
  // Filled at the portfolio level by aggregateHoldings (not aggregateHolding)
  weight_pct: number;            // cost_basis ÷ total portfolio cost_basis × 100
}

// Per-thesis rollup of holdings + performance.
export interface ThesisPerformance {
  thesis_id: string | null;            // null bucket = "Unassigned"
  thesis_name: string | null;
  holdings: Holding[];
  total_cost_basis: number;
  total_current_value: number;         // sum of holdings.current_value (null → 0)
  total_unrealized_pnl: number;
  total_realized_pnl: number;
}

// Top-of-page metrics on /portfolio.
export interface PortfolioSummary {
  holding_count: number;
  thesis_count: number;
  total_cost_basis: number;
  total_current_value: number;
  total_unrealized_pnl: number;
  total_realized_pnl: number;
  blended_return_pct: number;          // total_unrealized_pnl ÷ total_cost_basis × 100
}

export interface Conversation {
  id: string;
  thesis_id: string | null;
  title: string | null;
  status: ConversationStatus;
  iteration: number;
  fact_pack: FactPack | null;
  created_at: string;
  updated_at: string;
}

// Pre-flight fact pack — a one-shot LIVE macro snapshot assembled at
// conversation start and injected into the Phase-1 system prompt. Frozen for
// the life of the conversation (one-shot grounding, not surveillance).
export interface FactPackMacroRow {
  series_id: string;
  display_name: string;
  value: number | null;
  yoy_change: number | null;
  z_score_30y: number | null;
  observation_date: string;
  display_as: 'level' | 'yoy_pct';
}

export interface FactPackCycle {
  cycle_name: CycleName;
  status: CycleStatus;
  reading: string;
  detail: string | null;
}

export interface FactPack {
  as_of: string; // ISO timestamp the snapshot was assembled
  cycles: FactPackCycle[];
  macro: FactPackMacroRow[];
}

export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  model: string | null;
  phase: number | null;
  content: string;
  metadata: Record<string, unknown> | null;
  iteration: number;
  created_at: string;
  attachments?: Attachment[];
}

export type AttachmentKind = 'image' | 'pdf' | 'text';

export interface Attachment {
  id: string;
  message_id: string;
  kind: AttachmentKind;
  storage_path: string | null;
  filename: string;
  mime_type: string;
  size_bytes: number | null;
  content_text: string | null;
  created_at: string;
}

export interface StressTest {
  id: string;
  conversation_id: string;
  thesis_snapshot: Record<string, unknown>;
  contrarian_argument: string;
  disagreement_matrix: Array<{
    claim: string;
    claude_view: string;
    grok_view: string;
    severity?: string;
  }> | null;
  created_at: string;
}

export interface OpusVerdict {
  id: string;
  conversation_id: string;
  stress_test_id: string | null;
  verdict: Verdict;
  reasoning: string;
  user_challenge: string | null;
  user_override: boolean;
  final_decision: string | null;
  created_at: string;
}

export interface MacroIndicator {
  id: string;
  series_id: string;
  display_name: string;
  category: IndicatorCategory | null;
  observation_date: string;
  value: number | null;
  yoy_change: number | null;
  z_score_30y: number | null;
  updated_at: string;
}

export interface CycleReading {
  id: string;
  cycle_name: CycleName;
  reading_date: string;
  status: CycleStatus;
  classification: string | null;
  detail: string | null;
  contributing_series: Record<string, unknown> | null;
  created_at: string;
}

// Manual override per cycle gauge — applied on top of the rules-derived reading
// at query time. See lib/supabase/cycles-queries.ts → getMergedCycleReadings.
export interface CycleOverride {
  cycle_name: CycleName;
  reading_override: string;
  override_status: CycleStatus | null;
  detail_override: string | null;
  set_at: string;
  expires_at: string | null;
}

// What the page actually renders — rules baseline merged with active override.
export interface MergedCycleReading {
  cycle_name: CycleName;
  status: CycleStatus;
  reading: string;          // override.reading_override OR rules.classification
  detail: string | null;
  is_manual: boolean;       // true when an unexpired override is in effect
  set_at: string | null;    // override.set_at when is_manual, otherwise null
  rules_status: CycleStatus;          // the underlying rules-derived status, even when overridden
  rules_reading: string | null;       // the underlying rules-derived reading
  contributing_series: Record<string, unknown> | null;
  reading_date: string;
}

export interface Trigger {
  id: string;
  thesis_id: string;
  type: TriggerType;
  description: string;
  monitoring_signal: string | null;
  threshold: string | null;
  status: TriggerStatus;
  created_at: string;
  updated_at: string;
}

export interface NewsItem {
  id: string;
  source_url: string | null;
  source_name: string | null;
  headline: string;
  content: string | null;
  impact_summary: string | null;
  affected_thesis_ids: string[] | null;
  created_at: string;
}
