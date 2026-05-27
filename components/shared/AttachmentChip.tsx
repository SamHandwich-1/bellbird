'use client';

// Pre-send attachment chip. One per attached file, sits above the textarea.
// Click × to remove before send.

import { X, FileText, Image as ImageIcon } from 'lucide-react';
import { tokens } from '@/lib/tokens';
import type { UploadedAttachment } from '@/lib/supabase/storage';

export function AttachmentChip({
  attachment,
  onRemove,
}: {
  attachment: UploadedAttachment;
  onRemove: () => void;
}) {
  const Icon = attachment.kind === 'image' ? ImageIcon : FileText;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 8px',
        background: tokens.panelLift,
        border: `1px solid ${tokens.line}`,
        marginRight: 6,
        marginBottom: 6,
      }}
    >
      <Icon size={11} strokeWidth={1.5} color={tokens.muted} />
      <span
        className="mono"
        style={{
          fontSize: 10.5,
          color: tokens.body,
          letterSpacing: '0.02em',
          maxWidth: 180,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        title={attachment.filename}
      >
        {attachment.filename}
      </span>
      <button
        type="button"
        onClick={onRemove}
        className="btn-quiet"
        style={{
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          color: tokens.muted,
        }}
        aria-label={`Remove ${attachment.filename}`}
      >
        <X size={11} strokeWidth={1.5} />
      </button>
    </span>
  );
}
