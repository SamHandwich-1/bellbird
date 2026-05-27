'use client';

// Library detail positions table. Mockup: references/bellbird-mockup-v2-preview.jsx
//
// PositionRow click-to-expand reveals the position's notes (item 5).
// Entry / current / P/L surface only when current_price is available — these
// are target weights on a thesis, not live holdings. For theses where no
// matching current price has been set, the position rows render the weight
// only and the entry/current/P/L cells go to em-dashes.

import { useState } from 'react';
import { tokens } from '@/lib/tokens';
import type { Position } from '@/lib/types';

type PositionWithMarks = Position & {
  // Optional cost-basis info derived from trades when available. Source comes
  // from the page that renders the table — Library detail can pass null here.
  entry?: number | null;
  current?: number | null;
};

export function PositionsTable({ positions }: { positions: PositionWithMarks[] }) {
  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '64px 1fr 64px 80px 80px 70px',
          gap: 16,
          padding: '10px 0',
          borderBottom: `1px solid ${tokens.line}`,
        }}
      >
        <div className="label" style={{ color: tokens.faint }}>
          Ticker
        </div>
        <div className="label" style={{ color: tokens.faint }}>
          Name
        </div>
        <div className="label" style={{ color: tokens.faint, textAlign: 'right' }}>
          Weight
        </div>
        <div className="label" style={{ color: tokens.faint, textAlign: 'right' }}>
          Entry
        </div>
        <div className="label" style={{ color: tokens.faint, textAlign: 'right' }}>
          Current
        </div>
        <div className="label" style={{ color: tokens.faint, textAlign: 'right' }}>
          P/L
        </div>
      </div>
      {positions.map((p) => (
        <PositionRow key={p.id} position={p} />
      ))}
    </div>
  );
}

function PositionRow({ position }: { position: PositionWithMarks }) {
  const [open, setOpen] = useState(false);
  const hasMarks = position.entry != null && position.current != null;
  const pl = hasMarks
    ? ((position.current! - position.entry!) / position.entry!) * 100
    : null;
  const positive = pl != null && pl >= 0;
  const hasNotes = !!position.notes && position.notes.trim().length > 0;

  return (
    <div style={{ borderBottom: `1px solid ${tokens.line}` }}>
      <div
        onClick={() => hasNotes && setOpen(!open)}
        className="hairline-row"
        style={{
          display: 'grid',
          gridTemplateColumns: '64px 1fr 64px 80px 80px 70px',
          gap: 16,
          padding: '14px 0',
          alignItems: 'baseline',
          cursor: hasNotes ? 'pointer' : 'default',
        }}
      >
        <div className="mono" style={{ fontSize: 14, fontWeight: 600, color: tokens.text }}>
          {position.ticker}
        </div>
        <div className="sans" style={{ fontSize: 13, color: tokens.body }}>
          {position.name}
        </div>
        <div
          className="mono nums"
          style={{ fontSize: 12.5, textAlign: 'right', color: tokens.text }}
        >
          {position.weight}%
        </div>
        <div
          className="mono nums"
          style={{ fontSize: 12.5, textAlign: 'right', color: tokens.muted }}
        >
          {position.entry != null ? `$${position.entry.toFixed(2)}` : '—'}
        </div>
        <div
          className="mono nums"
          style={{ fontSize: 12.5, textAlign: 'right', color: tokens.text }}
        >
          {position.current != null ? `$${position.current.toFixed(2)}` : '—'}
        </div>
        <div
          className="mono nums"
          style={{
            fontSize: 13,
            fontWeight: 600,
            textAlign: 'right',
            color: pl == null ? tokens.faint : positive ? tokens.sage : tokens.terracotta,
          }}
        >
          {pl == null ? '—' : `${positive ? '+' : ''}${pl.toFixed(1)}%`}
        </div>
      </div>
      {open && hasNotes && (
        <div style={{ padding: '0 0 16px 0' }}>
          <p
            className="serif"
            style={{
              fontSize: 13.5,
              fontStyle: 'italic',
              lineHeight: 1.55,
              color: tokens.muted,
              margin: 0,
              maxWidth: '60ch',
            }}
          >
            {position.notes}
          </p>
        </div>
      )}
    </div>
  );
}
