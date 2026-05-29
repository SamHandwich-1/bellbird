import { tokens } from '@/lib/tokens';
import type { CycleStatus } from '@/lib/types';

// Bare track gradient — trough / expansion / peak / contraction zones.
// Matches references/bellbird-mockup-v2-cycles.jsx CycleGauge mockup.
// Diamond marker + prior tick are deliberately omitted: they require numeric
// 0–100 readings that ship with FRED. The track stays as ambient phase-space
// chrome until then.
const TRACK_GRADIENT = `linear-gradient(90deg,
  ${tokens.steel} 0%, ${tokens.steel} 18%,
  ${tokens.sage} 22%, ${tokens.sage} 48%,
  ${tokens.amber} 52%, ${tokens.amber} 72%,
  ${tokens.terracotta} 76%, ${tokens.terracotta} 100%)`;

const STATUS_COLOUR: Record<CycleStatus, string> = {
  healthy: tokens.sage,
  caution: tokens.amber,
  alert: tokens.terracotta,
};

function statusColour(status: CycleStatus | null): string {
  return status ? STATUS_COLOUR[status] : tokens.muted;
}

type Props = {
  name: string;
  phase: string | null;
  status: CycleStatus | null;
  detailProse: string | null;
  children?: React.ReactNode;
};

export function CycleGaugeBare({ name, phase, status, detailProse, children }: Props) {
  const phaseColour = statusColour(status);

  return (
    <div style={{ padding: '28px 0 28px', borderBottom: `1px solid ${tokens.line}` }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto auto',
          gap: 24,
          alignItems: 'baseline',
          marginBottom: 18,
        }}
      >
        <div>
          <h3
            className="serif"
            style={{
              fontSize: 19,
              fontWeight: 600,
              color: tokens.text,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            {name}
          </h3>
          <div
            style={{
              display: 'flex',
              gap: 16,
              marginTop: 6,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <span className="label" style={{ color: phaseColour }}>
              {phase ?? '—'}
            </span>
            <span
              className="mono"
              style={{ fontSize: 10.5, color: tokens.muted, letterSpacing: '0.04em' }}
            >
              Key metric · <span style={{ color: tokens.faint }}>—</span>
            </span>
          </div>
        </div>
        <div
          className="mono nums"
          style={{
            fontSize: 10,
            color: tokens.faint,
            letterSpacing: '0.06em',
            textAlign: 'right',
          }}
        >
          PRIOR —<br />—
        </div>
        <div
          className="mono nums"
          style={{
            fontSize: 30,
            fontWeight: 700,
            color: tokens.faint,
            lineHeight: 1,
            textAlign: 'right',
            minWidth: 60,
          }}
        >
          —
        </div>
      </div>

      <div style={{ position: 'relative', height: 12, margin: '0 0 6px' }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 2,
            background: TRACK_GRADIENT,
            opacity: 0.55,
          }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
        <span className="label" style={{ color: tokens.faint }}>Trough</span>
        <span className="label" style={{ color: tokens.faint }}>Expansion</span>
        <span className="label" style={{ color: tokens.faint }}>Peak</span>
        <span className="label" style={{ color: tokens.faint }}>Contraction</span>
      </div>

      <p
        className="serif"
        style={{
          fontSize: 13.5,
          fontStyle: 'italic',
          lineHeight: 1.6,
          color: detailProse ? tokens.muted : tokens.faint,
          margin: '20px 0 0',
          maxWidth: '62ch',
        }}
      >
        {detailProse ?? '—'}
      </p>

      {children}
    </div>
  );
}
