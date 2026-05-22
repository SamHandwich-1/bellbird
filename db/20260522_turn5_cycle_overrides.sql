-- Turn 5 — Cycles mode
-- Adds a small overrides table so James can write a manual reading for any of
-- the three cycle gauges. The rules-based reading still lives in cycle_readings;
-- the override is merged in at query time. Scoped to (cycle_name) so daily cron
-- writes to cycle_readings don't clobber it — no carry-forward logic needed.

CREATE TABLE IF NOT EXISTS cycle_overrides (
  cycle_name TEXT PRIMARY KEY CHECK (cycle_name IN ('credit', 'market', 'juglar')),
  reading_override TEXT NOT NULL,
  override_status TEXT CHECK (
    override_status IS NULL OR
    override_status IN ('healthy', 'caution', 'alert')
  ),
  detail_override TEXT,
  set_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);
