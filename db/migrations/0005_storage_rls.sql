-- 0005_storage_rls.sql
-- Run in Supabase SQL Editor AFTER creating the `thesis-attachments` bucket.
--
-- Migration 0003 added RLS to the `attachments` *table*, but Supabase Storage
-- enforces RLS separately on `storage.objects`. Without these policies the
-- client-side `uploadAttachment` call fails with
--   "new row violates row-level security policy"
-- because the default Storage RLS denies all writes.
--
-- Conversation-level access gating happens upstream (chat route + message
-- inserts go through the standard `messages` / `attachments` table policies).
-- Within the bucket itself, any authenticated user has full access; we don't
-- partition Storage by user since Bellbird is single-user.

-- Idempotent — safe to re-run.
DROP POLICY IF EXISTS "thesis-attachments insert" ON storage.objects;
DROP POLICY IF EXISTS "thesis-attachments select" ON storage.objects;
DROP POLICY IF EXISTS "thesis-attachments delete" ON storage.objects;

CREATE POLICY "thesis-attachments insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'thesis-attachments');

CREATE POLICY "thesis-attachments select"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'thesis-attachments');

CREATE POLICY "thesis-attachments delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'thesis-attachments');
