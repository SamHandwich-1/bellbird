// Inline data-fetch row in the Develop chat stream. Pure chrome in Turn B —
// no chat path emits these yet (item 6 / live data fetching is deferred).
// Built so it's wireable when item 6 lands.
//
// Mockup: references/bellbird-mockup-v2-stack.jsx

import { tokens } from '@/lib/tokens';

export function DataFetchEvent({
  text,
  detail,
  time,
}: {
  text: string;
  detail?: string;
  time?: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 12,
        padding: '10px 14px',
        background: tokens.panel,
        border: `1px solid ${tokens.line}`,
        marginBottom: 20,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: tokens.chime,
          flexShrink: 0,
          alignSelf: 'center',
        }}
      />
      <div style={{ flex: 1 }}>
        <div
          className="mono"
          style={{ fontSize: 11, color: tokens.body, letterSpacing: '0.02em', marginBottom: 3 }}
        >
          {text}
        </div>
        {detail && (
          <div
            className="mono nums"
            style={{ fontSize: 10.5, color: tokens.muted, letterSpacing: '0.04em' }}
          >
            {detail}
          </div>
        )}
      </div>
      {time && (
        <span
          className="mono"
          style={{ fontSize: 9.5, color: tokens.faint, letterSpacing: '0.06em' }}
        >
          {time}
        </span>
      )}
    </div>
  );
}
