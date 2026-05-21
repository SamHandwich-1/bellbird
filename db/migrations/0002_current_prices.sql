-- 0002_current_prices.sql
-- Run in Supabase SQL Editor.
--
-- Manual current-price lookup for portfolio holdings. One row per ticker;
-- updated when the user inline-edits a Current price on the Portfolio page.
-- Polygon live prices stay deferred to v1.2; until then this is the only
-- source of "current" prices for P&L calculation.

CREATE TABLE current_prices (
  ticker      TEXT PRIMARY KEY,
  price       NUMERIC NOT NULL,
  currency    TEXT DEFAULT 'AUD',
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- RLS — match the single-user "authenticated full access" pattern from Turn 2.
ALTER TABLE current_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated full access" ON current_prices
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
