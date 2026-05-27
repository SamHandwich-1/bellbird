// Library list row. Mockup: references/bellbird-mockup-v2-preview.jsx

import Link from 'next/link';
import { tokens, cycleStageColor, convictionColor } from '@/lib/tokens';
import type { Thesis } from '@/lib/types';

export function ThesisRow({
  thesis,
  positions,
}: {
  thesis: Thesis;
  positions: string[];
}) {
  const conv = convictionColor(thesis.conviction);
  const cyc = cycleStageColor(thesis.cycle_stage);
  return (
    <Link
      href={`/library/${thesis.id}`}
      className="hairline-row btn-quiet"
      style={{
        borderBottom: `1px solid ${tokens.line}`,
        padding: '24px 0',
        cursor: 'pointer',
        display: 'grid',
        gridTemplateColumns: '1fr 88px',
        gap: 32,
        alignItems: 'baseline',
        color: 'inherit',
        textDecoration: 'none',
      }}
    >
      <div style={{ minWidth: 0 }}>
        {/* Name + portfolio dot */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
          <h3
            className="serif"
            style={{
              fontSize: 21,
              fontWeight: 600,
              color: tokens.text,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            {thesis.name}
          </h3>
          {thesis.in_portfolio && (
            <span
              title="In portfolio"
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: tokens.chime,
                boxShadow: `0 0 6px ${tokens.chime}aa`,
                display: 'inline-block',
              }}
            />
          )}
        </div>

        {/* Meta row */}
        <div
          style={{
            display: 'flex',
            gap: 18,
            marginBottom: 12,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          {thesis.sector && (
            <span
              className="mono"
              style={{ fontSize: 10.5, color: tokens.muted, letterSpacing: '0.04em' }}
            >
              {thesis.sector}
            </span>
          )}
          {thesis.cycle_stage && (
            <span className="label" style={{ color: cyc }}>
              {thesis.cycle_stage.replace('-', ' ')}
            </span>
          )}
          {thesis.in_portfolio && (
            <span className="label" style={{ color: tokens.chime }}>
              In portfolio
            </span>
          )}
        </div>

        {/* Summary */}
        {thesis.summary && (
          <p
            className="serif"
            style={{
              fontSize: 14.5,
              lineHeight: 1.55,
              color: tokens.body,
              margin: '0 0 10px',
              maxWidth: '60ch',
            }}
          >
            {thesis.summary}
          </p>
        )}

        {/* Positions */}
        {positions.length > 0 && (
          <div
            className="mono nums"
            style={{ fontSize: 10.5, color: tokens.faint, letterSpacing: '0.08em' }}
          >
            {positions.join('  ·  ')}
          </div>
        )}
      </div>

      {/* Conviction number */}
      <div style={{ textAlign: 'right' }}>
        <div
          className="mono nums"
          style={{ fontSize: 32, fontWeight: 700, color: conv, lineHeight: 1 }}
        >
          {thesis.conviction}
        </div>
        <div className="label" style={{ color: tokens.faint, marginTop: 6 }}>
          Conviction
        </div>
      </div>
    </Link>
  );
}
