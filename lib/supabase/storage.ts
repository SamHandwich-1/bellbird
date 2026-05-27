// Shared types and constants for the thesis-attachments bucket.
// Client and server helpers live in separate files to keep next/headers out
// of bundles that get sent to the browser.

export const ATTACHMENT_BUCKET = 'thesis-attachments';

export type UploadedAttachment = {
  storage_path: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  kind: 'image' | 'pdf';
};

export function attachmentKindFromMime(mime: string): 'image' | 'pdf' | null {
  if (mime.startsWith('image/')) return 'image';
  if (mime === 'application/pdf') return 'pdf';
  return null;
}
