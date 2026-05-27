-- 0003_attachments.sql
-- Run in Supabase SQL Editor.
--
-- Item 13: attachments on Develop messages (images, PDFs, pasted text).
-- One row per attachment, linked to the user message it shipped with.
-- Binary content lives in the `thesis-attachments` Storage bucket; this row
-- holds the storage_path + metadata so we can rebuild signed URLs on read.

CREATE TABLE attachments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id   UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  kind         TEXT NOT NULL CHECK (kind IN ('image', 'pdf', 'text')),
  storage_path TEXT,                                  -- null for 'text' attachments (content inlined)
  filename     TEXT NOT NULL,
  mime_type    TEXT NOT NULL,
  size_bytes   INT,
  content_text TEXT,                                  -- populated for 'text' kind only (pasted transcript bodies)
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_attachments_message ON attachments(message_id);

ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated full access" ON attachments
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
