-- 0006_triggers.sql
-- Run in Supabase SQL Editor.
--
-- Item 7 (TESTING_LOG): triggers as first-class per-thesis data. Manual
-- entry only in Bellbird — no live evaluation, no firing logic, no cron.
-- Wedgetail-ready shape so the schema doesn't need rewriting later.
--
-- The v1 triggers table (label / trigger_date / priority / status:
-- pending|fired|dismissed) is dropped because (a) zero rows in production
-- and (b) the columns don't match the item-7 spec. DROP cascades the v1
-- RLS policy created by db/policies.sql; this migration recreates RLS at
-- the bottom so the table is locked down again after the recreate.
--
-- Three trigger types: confirming, disconfirming, kill-on-sight. The
-- mockup's fourth 'action' type is a Wedgetail concern (draft-command
-- semantics) and is intentionally out of scope. 'kill-armed' is derived
-- (type='kill-on-sight' AND status='armed'), not a status value.
--
-- monitoring_signal and threshold are nullable because manual-entry
-- triggers can be purely qualitative ("Eaton order book extension"
-- without a precise threshold). Tightening to NOT NULL later is cheap;
-- forcing it now creates friction.

DROP TABLE IF EXISTS triggers;

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

CREATE TRIGGER triggers_updated_at BEFORE UPDATE ON triggers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE triggers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated full access" ON triggers
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
