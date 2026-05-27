import 'server-only';

// Server-side storage helper for Develop-mode attachments (item 13).
// Used by the chat API route to fetch signed URLs before forwarding bytes
// to Anthropic.

import { createClient as createServerClient } from './server';
import { ATTACHMENT_BUCKET } from './storage';

export async function getAttachmentSignedUrl(
  storage_path: string,
  expiresInSec = 3600,
): Promise<string | null> {
  const supabase = await createServerClient();
  const { data, error } = await supabase.storage
    .from(ATTACHMENT_BUCKET)
    .createSignedUrl(storage_path, expiresInSec);
  if (error || !data) return null;
  return data.signedUrl;
}
