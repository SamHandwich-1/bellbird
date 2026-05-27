-- 0004_message_iteration.sql
-- Run in Supabase SQL Editor.
--
-- Item 14: iterate UX preserves prior state as a sub-discussion below.
-- The conversation row stays the same — what changes is that every message
-- carries an `iteration` index. resetToPhase1 bumps the conversation's
-- iteration counter; the chat route reads it and stamps the bumped value
-- onto every new message. The UI walks the message stream and inserts an
-- IterationDivider whenever iteration increments.

ALTER TABLE conversations
  ADD COLUMN iteration SMALLINT NOT NULL DEFAULT 0;

ALTER TABLE messages
  ADD COLUMN iteration SMALLINT NOT NULL DEFAULT 0;

CREATE INDEX idx_messages_iteration ON messages(conversation_id, iteration);
