-- 0007_conversation_fact_pack.sql
-- Run in Supabase SQL Editor.
--
-- Item 24 (TESTING_LOG): Phase-1 pre-flight fact pack — slice 1.
-- A one-shot LIVE macro snapshot (FRED macro already in macro_indicators +
-- the rules-derived cycle readings) is assembled at conversation start and
-- persisted on the conversation row, then injected into the Phase-1 system
-- prompt on every turn. Frozen at create: a conversation resumed days later
-- reasons against day-one macro by design (this is one-shot grounding, not
-- continuous surveillance). Iterate (resetToPhase1) does NOT re-snapshot.
--
-- Additive, nullable. No RLS change: db/policies.sql conversations policy is
-- FOR ALL TO authenticated USING (true) WITH CHECK (true) — column-agnostic,
-- and table-level grants cover columns added later. schema.sql is not
-- back-edited (base + incremental migrations; cf. iteration in 0004).

ALTER TABLE conversations
  ADD COLUMN fact_pack JSONB;
