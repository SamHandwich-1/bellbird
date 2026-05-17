-- 0001_supersede_pipeline_rows.sql
-- Run in Supabase SQL Editor.
--
-- Soft-supersede mechanism for pipeline outputs. When a thesis goes back to
-- Phase 1 via the Iterate action, prior Phase 2/3/4 rows are marked as
-- superseded rather than deleted. Audit trail preserved; current-iteration
-- queries filter `superseded_at IS NULL`. Partial indexes keep the active-row
-- reads fast.

ALTER TABLE messages       ADD COLUMN superseded_at TIMESTAMPTZ NULL;
ALTER TABLE stress_tests   ADD COLUMN superseded_at TIMESTAMPTZ NULL;
ALTER TABLE opus_verdicts  ADD COLUMN superseded_at TIMESTAMPTZ NULL;

CREATE INDEX idx_messages_active      ON messages(conversation_id, phase) WHERE superseded_at IS NULL;
CREATE INDEX idx_stress_tests_active  ON stress_tests(conversation_id)    WHERE superseded_at IS NULL;
CREATE INDEX idx_opus_verdicts_active ON opus_verdicts(conversation_id)   WHERE superseded_at IS NULL;
