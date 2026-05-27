'use client';

// File picker for Develop chat input. Item 13: images (PNG/JPG) + PDFs.
// Uploads to Supabase Storage immediately on selection; the returned ref is
// passed back to the parent so it can be shipped with the next message and
// persisted as an attachment row.
//
// Text-pasted attachments (YouTube transcripts, article bodies) aren't
// handled here — those land via direct paste into the textarea and would
// need their own flow if we wanted them as separate attachment rows. Not in
// scope this turn.

import { useRef, useState } from 'react';
import { Paperclip } from 'lucide-react';
import { toast } from 'sonner';
import { tokens } from '@/lib/tokens';
import { uploadAttachment } from '@/lib/supabase/storage-client';
import type { UploadedAttachment } from '@/lib/supabase/storage';

const ACCEPT = 'image/png,image/jpeg,application/pdf';
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB ceiling per file

export function AttachmentButton({
  conversationId,
  onUploaded,
}: {
  conversationId: string;
  onUploaded: (attachment: UploadedAttachment) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // reset so re-picking the same file fires onChange again
    if (!file) return;

    if (file.size > MAX_SIZE_BYTES) {
      toast.error(`${file.name} is over 10 MB.`);
      return;
    }

    setBusy(true);
    const result = await uploadAttachment(file, conversationId);
    setBusy(false);

    if ('error' in result) {
      toast.error(result.error);
      return;
    }
    onUploaded(result);
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        onChange={onPick}
        style={{ display: 'none' }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        style={{
          width: 38,
          height: 38,
          borderRadius: 2,
          background: 'transparent',
          border: `1.5px solid ${tokens.line}`,
          cursor: busy ? 'wait' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 200ms ease',
          flexShrink: 0,
          opacity: busy ? 0.5 : 1,
        }}
        title="Attach an image or PDF"
        aria-label="Attach a file"
      >
        <Paperclip size={14} strokeWidth={1.5} color={tokens.muted} />
      </button>
    </>
  );
}
