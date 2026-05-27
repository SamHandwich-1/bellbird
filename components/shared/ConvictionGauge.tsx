// Thesis-detail hero gauge. Mockup: references/bellbird-mockup-v2-preview.jsx
//
// Turn B renders the current marker only. The "Moved from N" prior tick and
// the trajectory read paragraph come online when conviction history (item 9)
// ships. Component takes optional `prior` + `priorDate` and suppresses the
// tick when prior is null.

import { tokens } from '@/lib/tokens';

export function ConvictionGauge({
  current,
  prior,
  priorDate,
  lastUpdated,
}: {
  current: number;
  prior?: number | null;
  priorDate?: string | null;
  lastUpdated?: string | null;
}) {
  const hasPrior = typeof prior === 'number' && prior !== current;

  return (
    <div
      style={{
        margin: '8px 0 48px',
        padding: '24px 0 28px',
        borderTop: `1px solid ${tokens.line}`,
        borderBottom: `1px solid ${tokens.line}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 36,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div>
          <div className="label" style={{ color: tokens.muted, marginBottom: 4 }}>
            Conviction · 0–100 scale
          </div>
          <div
            className="serif"
            style={{ fontSize: 13, fontStyle: 'italic', color: tokens.faint }}
          >
            {hasPrior && priorDate
              ? `Moved from ${prior} on ${priorDate}`
              : 'Conviction history lands when the trajectory feature ships.'}
          </div>
        </div>
        {lastUpdated && (
          <div
            className="mono"
            style={{ fontSize: 10, color: tokens.faint, letterSpacing: '0.06em' }}
          >
            LAST UPDATED · {lastUpdated.toUpperCase()}
          </div>
        )}
      </div>

      <div style={{ position: 'relative', height: 14, margin: '0 0 8px' }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 2,
            background: `linear-gradient(90deg, ${tokens.terracotta} 0%, ${tokens.terracotta} 38%, ${tokens.amber} 42%, ${tokens.amber} 68%, ${tokens.sage} 72%, ${tokens.sage} 100%)`,
            opacity: 0.85,
          }}
        />

        {hasPrior && (
          <div
            style={{
              position: 'absolute',
              left: `${prior}%`,
              top: -6,
              bottom: -6,
              width: 1,
              background: tokens.body,
              opacity: 0.45,
            }}
          >
            <div
              className="mono"
              style={{
                position: 'absolute',
                top: -16,
                left: '50%',
                transform: 'translateX(-50%)',
                whiteSpace: 'nowrap',
                fontSize: 8.5,
                color: tokens.muted,
                letterSpacing: '0.04em',
              }}
            >
              PRIOR {prior}
            </div>
          </div>
        )}

        <div
          style={{
            position: 'absolute',
            left: `${current}%`,
            top: -11,
            bottom: -11,
            width: 2.5,
            background: tokens.chime,
            boxShadow: `0 0 10px ${tokens.chime}aa`,
            transform: 'translateX(-50%)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -8,
              left: '50%',
              transform: 'translateX(-50%) rotate(45deg)',
              width: 9,
              height: 9,
              background: tokens.chime,
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}>
        <span
          className="mono"
          style={{ fontSize: 9.5, color: tokens.faint, letterSpacing: '0.06em' }}
        >
          0 · REJECT
        </span>
        <span
          className="mono"
          style={{ fontSize: 9.5, color: tokens.faint, letterSpacing: '0.06em' }}
        >
          40 · LOW
        </span>
        <span
          className="mono"
          style={{ fontSize: 9.5, color: tokens.faint, letterSpacing: '0.06em' }}
        >
          70 · HIGH
        </span>
        <span
          className="mono"
          style={{ fontSize: 9.5, color: tokens.faint, letterSpacing: '0.06em' }}
        >
          100 · MAX
        </span>
      </div>
    </div>
  );
}
