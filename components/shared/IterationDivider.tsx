// Item 14: visual divider between iteration groups in a Develop conversation.
// Rendered between message groups when the `iteration` column increments.

import { tokens } from '@/lib/tokens';

export function IterationDivider({ iteration }: { iteration: number }) {
  return (
    <div style={{ margin: '32px 0 28px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          marginBottom: 4,
        }}
      >
        <div style={{ flex: 1, height: 0, borderTop: `1px solid ${tokens.line}` }} />
        <span className="label" style={{ color: tokens.chime }}>
          Iteration {iteration + 1}
        </span>
        <div style={{ flex: 1, height: 0, borderTop: `1px solid ${tokens.line}` }} />
      </div>
      <p
        className="serif"
        style={{
          fontSize: 12.5,
          fontStyle: 'italic',
          color: tokens.faint,
          textAlign: 'center',
          margin: 0,
        }}
      >
        Prior thesis, positions, and stress test preserved above.
      </p>
    </div>
  );
}
