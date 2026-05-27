// Develop chat bubble. Mockup: references/bellbird-mockup-v2-stack.jsx
// Item 16: markdown including tables renders via MarkdownContent.
// The <suggestions> block parsing happens at the parent (ConversationPane) so
// PromptPrefillChips can be rendered as a sibling rather than a child.

import { tokens } from '@/lib/tokens';
import { MarkdownContent } from './MarkdownContent';

type Role = 'opus' | 'user';

export function ChatBubble({
  role,
  time,
  children,
}: {
  role: Role;
  time?: string;
  children: string;
}) {
  const isOpus = role === 'opus';
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
        <span className="label" style={{ color: isOpus ? tokens.chime : tokens.muted }}>
          {isOpus ? 'Opus' : 'You'}
        </span>
        {time && (
          <span
            className="mono"
            style={{ fontSize: 9.5, color: tokens.faint, letterSpacing: '0.06em' }}
          >
            {time}
          </span>
        )}
      </div>
      <div
        className="serif"
        style={{
          fontSize: 14.5,
          lineHeight: 1.6,
          color: isOpus ? tokens.body : tokens.text,
          paddingLeft: isOpus ? 0 : 14,
          borderLeft: isOpus ? 'none' : `1px solid ${tokens.line}`,
          maxWidth: '60ch',
        }}
      >
        <MarkdownContent>{children}</MarkdownContent>
      </div>
    </div>
  );
}
