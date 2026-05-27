// Library detail planned-feature placeholder. Mockup:
// references/bellbird-mockup-v2-preview.jsx (Triggers / Conviction history /
// Discussion log).

import { tokens } from '@/lib/tokens';

export function PlannedSection({
  label,
  sub,
}: {
  label: string;
  sub: string;
}) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 12,
          paddingBottom: 10,
          borderBottom: `1px solid ${tokens.line}`,
        }}
      >
        <div className="label" style={{ color: tokens.faint }}>
          {label}
        </div>
        <div
          className="mono"
          style={{ fontSize: 9.5, color: tokens.chime, letterSpacing: '0.12em' }}
        >
          PLANNED
        </div>
      </div>
      <p
        className="serif"
        style={{
          fontSize: 13.5,
          fontStyle: 'italic',
          color: tokens.faint,
          margin: 0,
          lineHeight: 1.55,
        }}
      >
        {sub}
      </p>
    </div>
  );
}
