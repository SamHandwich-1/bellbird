// Phase 2 structured-draft card, v2 styling.

import { tokens, cycleStageColor, formatStage } from '@/lib/tokens';
import type { StructuredThesis } from '@/lib/ai/schemas';

export function StructuredDraftCard({ draft }: { draft: StructuredThesis }) {
  return (
    <div
      style={{
        background: tokens.panel,
        border: `1px solid ${tokens.line}`,
        padding: 24,
        marginBottom: 24,
      }}
    >
      <div className="label" style={{ color: tokens.chime, marginBottom: 16 }}>
        Phase 2 · Structured draft
      </div>

      <h3
        className="serif"
        style={{
          fontSize: 26,
          fontWeight: 600,
          letterSpacing: '-0.01em',
          color: tokens.text,
          margin: '0 0 10px',
        }}
      >
        {draft.name}
      </h3>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 14,
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <span className="mono" style={{ fontSize: 11, color: tokens.muted }}>
          {draft.sector}
        </span>
        <span className="label" style={{ color: cycleStageColor(draft.cycle_stage) }}>
          {formatStage(draft.cycle_stage).toLowerCase()}
        </span>
        <span className="mono nums" style={{ fontSize: 11, color: tokens.body }}>
          {draft.conviction}%
        </span>
        <span className="mono" style={{ fontSize: 11, color: tokens.muted }}>
          {draft.timing}
        </span>
      </div>

      <p
        className="serif"
        style={{
          fontSize: 15,
          lineHeight: 1.6,
          color: tokens.body,
          margin: '0 0 14px',
          maxWidth: '60ch',
        }}
      >
        {draft.summary}
      </p>

      {draft.hedge_note && (
        <p
          className="serif"
          style={{
            fontSize: 13,
            lineHeight: 1.55,
            color: tokens.muted,
            fontStyle: 'italic',
            margin: '0 0 18px',
            maxWidth: '60ch',
          }}
        >
          Hedge: {draft.hedge_note}
        </p>
      )}

      <div
        style={{
          paddingTop: 14,
          borderTop: `1px solid ${tokens.line}`,
        }}
      >
        <div className="label" style={{ color: tokens.muted, marginBottom: 12 }}>
          Positions · {draft.positions.length}
        </div>
        {draft.positions.map((p, i) => (
          <div
            key={`${p.ticker}-${i}`}
            style={{
              display: 'grid',
              gridTemplateColumns: '64px 1fr 56px 60px 1fr',
              gap: 12,
              padding: '8px 0',
              borderBottom: `1px solid ${tokens.line}`,
              alignItems: 'baseline',
            }}
          >
            <span className="mono" style={{ fontSize: 12.5, fontWeight: 600, color: tokens.text }}>
              {p.ticker}
            </span>
            <span className="sans" style={{ fontSize: 12, color: tokens.body }}>
              {p.name}
            </span>
            <span
              className="mono nums"
              style={{ fontSize: 12, textAlign: 'right', color: tokens.text }}
            >
              {p.weight}%
            </span>
            <span
              className="label"
              style={{
                color:
                  p.side === 'long'
                    ? tokens.sage
                    : p.side === 'short'
                      ? tokens.terracotta
                      : tokens.steel,
                textAlign: 'right',
              }}
            >
              {p.side}
            </span>
            <span className="sans" style={{ fontSize: 11.5, color: tokens.muted }}>
              {p.notes ?? ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
