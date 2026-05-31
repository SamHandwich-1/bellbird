-- Bellbird — full schema. Run this in the Supabase SQL editor before first deploy.
-- Source: PLAN.md §3.

-- Theses: the core thesis records
CREATE TABLE theses (
  id TEXT PRIMARY KEY,                       -- e.g. 'grid-resilience-2026'
  name TEXT NOT NULL,
  sector TEXT,
  conviction INT NOT NULL CHECK (conviction >= 0 AND conviction <= 100),
  timing TEXT,
  status TEXT NOT NULL DEFAULT 'active',     -- 'active' | 'watching' | 'closed'
  cycle_stage TEXT,                          -- 'secular' | 'long-cycle' | 'mid-cycle' | 'credit-cycle' | 'narrative-cycle'
  summary TEXT,
  hedge_note TEXT,
  in_portfolio BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_theses_cycle_stage ON theses(cycle_stage);
CREATE INDEX idx_theses_status ON theses(status);

-- Positions: target allocations within each thesis (not actual trades)
CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thesis_id TEXT REFERENCES theses(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  name TEXT NOT NULL,
  weight NUMERIC NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('long', 'short', 'hedge')),
  valuation TEXT,
  upside NUMERIC,
  notes TEXT,
  position_order INT,                        -- for ordering within thesis
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_positions_thesis ON positions(thesis_id);

-- Trades: actual executed trades (entry/exit)
CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thesis_id TEXT REFERENCES theses(id) ON DELETE SET NULL,
  ticker TEXT NOT NULL,
  side TEXT NOT NULL,                        -- 'buy' | 'sell'
  quantity NUMERIC NOT NULL,
  price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'AUD',
  fees NUMERIC DEFAULT 0,
  executed_at TIMESTAMPTZ NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_trades_thesis ON trades(thesis_id);
CREATE INDEX idx_trades_ticker ON trades(ticker);

-- Conversations: Develop mode threads
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thesis_id TEXT REFERENCES theses(id) ON DELETE SET NULL,
  title TEXT,                                -- auto-generated summary
  status TEXT DEFAULT 'open',                -- 'open' | 'phase_2' | 'phase_3' | 'phase_4' | 'completed' | 'discarded'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Messages: individual turns in a conversation
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,                        -- 'user' | 'assistant'
  model TEXT,                                -- 'opus-4.7' | 'sonnet-4.6' | 'grok-4' | null for user
  phase INT,                                 -- 1, 2, 3, or 4 (null for user)
  content TEXT NOT NULL,
  metadata JSONB,                            -- tokens, latency, cost estimate
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);

-- Stress tests: Grok phase 3 outputs
CREATE TABLE stress_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  thesis_snapshot JSONB NOT NULL,            -- frozen thesis state at time of test
  contrarian_argument TEXT NOT NULL,
  disagreement_matrix JSONB,                 -- [{claim, claude_view, grok_view, severity}]
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Opus verdicts: phase 4 adjudications
CREATE TABLE opus_verdicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  stress_test_id UUID REFERENCES stress_tests(id),
  verdict TEXT NOT NULL CHECK (verdict IN ('PROCEED', 'STRESS_TEST', 'CLARIFY', 'DISCARD')),
  reasoning TEXT NOT NULL,
  user_challenge TEXT,                       -- null if user accepted, populated if challenged
  user_override BOOLEAN DEFAULT false,
  final_decision TEXT,                       -- after challenge if applicable
  created_at TIMESTAMPTZ DEFAULT now()
);

-- News items: paste-in news with impact analysis (v1.1+)
CREATE TABLE news_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_url TEXT,
  source_name TEXT,
  headline TEXT NOT NULL,
  content TEXT,
  impact_summary TEXT,                       -- Sonnet first pass
  affected_thesis_ids TEXT[],                -- array of thesis IDs flagged as affected
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Triggers: per-thesis invalidation conditions (item 7). Manual entry in v1;
-- Wedgetail consumes the same shape for automation later. Three types:
-- confirming, disconfirming, kill-on-sight. 'kill-armed' is derived
-- (type='kill-on-sight' AND status='armed'), not a status value.
-- monitoring_signal and threshold are nullable so qualitative triggers can
-- be entered description-only.
CREATE TABLE triggers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thesis_id         TEXT NOT NULL REFERENCES theses(id) ON DELETE CASCADE,
  type              TEXT NOT NULL CHECK (type IN ('confirming', 'disconfirming', 'kill-on-sight')),
  description       TEXT NOT NULL,
  monitoring_signal TEXT,
  threshold         TEXT,
  status            TEXT NOT NULL DEFAULT 'armed' CHECK (status IN ('armed', 'fired', 'disarmed')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_triggers_thesis ON triggers(thesis_id);

-- Macro indicators: time series cached from FRED for Cycles page
CREATE TABLE macro_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id TEXT NOT NULL,                   -- FRED series ID, e.g. 'CPILFESL'
  display_name TEXT NOT NULL,
  category TEXT,                             -- 'rates' | 'credit' | 'equity' | 'real_economy' | 'sentiment'
  observation_date DATE NOT NULL,
  value NUMERIC,
  yoy_change NUMERIC,
  z_score_30y NUMERIC,                       -- standardized vs 30-year history
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(series_id, observation_date)
);

CREATE INDEX idx_macro_series_date ON macro_indicators(series_id, observation_date DESC);
CREATE INDEX idx_macro_category ON macro_indicators(category);

-- Cycle readings: derived current state for the three cycles
CREATE TABLE cycle_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_name TEXT NOT NULL,                  -- 'credit' | 'equity' | 'juglar'
  reading_date DATE NOT NULL,
  status TEXT NOT NULL,                      -- 'healthy' | 'caution' | 'alert'
  classification TEXT,                       -- 'late expansion' | 'turning' | 'recovery' etc.
  detail TEXT,
  contributing_series JSONB,                 -- which indicators drove this reading
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(cycle_name, reading_date)
);

-- Auto-update updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER theses_updated_at BEFORE UPDATE ON theses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER triggers_updated_at BEFORE UPDATE ON triggers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
