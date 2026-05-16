-- Bellbird — RLS policies. Run in Supabase SQL editor after db/schema.sql.
-- Single-user app: authenticated users get full access on every table.
-- Anonymous traffic is denied. Multi-tenant later would add user_id columns
-- and rewrite each policy to bind on auth.uid() = user_id.

ALTER TABLE theses             ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades             ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages           ENABLE ROW LEVEL SECURITY;
ALTER TABLE stress_tests       ENABLE ROW LEVEL SECURITY;
ALTER TABLE opus_verdicts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE triggers           ENABLE ROW LEVEL SECURITY;
ALTER TABLE macro_indicators   ENABLE ROW LEVEL SECURITY;
ALTER TABLE cycle_readings     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated full access" ON theses
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated full access" ON positions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated full access" ON trades
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated full access" ON conversations
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated full access" ON messages
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated full access" ON stress_tests
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated full access" ON opus_verdicts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated full access" ON news_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated full access" ON triggers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated full access" ON macro_indicators
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated full access" ON cycle_readings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
