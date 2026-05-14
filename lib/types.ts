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
export type CycleName = 'credit' | 'equity' | 'juglar';
export type CycleStatus = 'healthy' | 'caution' | 'alert';
export type IndicatorCategory =
  | 'rates'
  | 'credit'
  | 'equity'
  | 'real_economy'
  | 'sentiment';
export type TriggerPriority = 'high' | 'medium' | 'low';
export type TriggerStatus = 'pending' | 'fired' | 'dismissed';

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

export interface Conversation {
  id: string;
  thesis_id: string | null;
  title: string | null;
  status: ConversationStatus;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  model: string | null;
  phase: number | null;
  content: string;
  metadata: Record<string, unknown> | null;
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

export interface Trigger {
  id: string;
  thesis_id: string;
  label: string;
  trigger_date: string | null;
  priority: TriggerPriority;
  status: TriggerStatus;
  notes: string | null;
  created_at: string;
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
