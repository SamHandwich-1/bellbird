'use client';

// Client-side storage helper for Develop-mode attachments (item 13).
// Used by AttachmentButton.

import { createClient as createBrowserClient } from './client';
import {
  ATTACHMENT_BUCKET,
  attachmentKindFromMime,
  type UploadedAttachment,
} from './storage';

export async function uploadAttachment(
  file: File,
  conversationId: string,
): Promise<UploadedAttachment | { error: string }> {
  const kind = attachmentKindFromMime(file.type);
  if (!kind) return { error: `Unsupported file type: ${file.type}` };

  const supabase = createBrowserClient();
  const path = `${conversationId}/${Date.now()}-${file.name}`;

  const { error } = await supabase.storage.from(ATTACHMENT_BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) return { error: error.message };

  return {
    storage_path: path,
    filename: file.name,
    mime_type: file.type,
    size_bytes: file.size,
    kind,
  };
}
