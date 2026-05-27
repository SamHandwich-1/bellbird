// Portfolio correlation-cluster row. Mockup:
// references/bellbird-mockup-v2-stack.jsx
//
// Ships in shared for the follow-up turn that wires correlation clusters from
// backing data. The Correlation clusters section is *omitted* from the
// Portfolio page in Turn B per plan (no data behind it; we don't fake).

import { tokens } from '@/lib/tokens';

export function CorrelationRow({
  name,
  pct,
  theses,
}: {
  name: string;
  pct: number;
  theses: string[];
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: 24,
        padding: '16px 0',
        borderBottom: `1px solid ${tokens.line}`,
        alignItems: 'baseline',
      }}
    >
      <div>
        <div
          className="serif"
          style={{ fontSize: 14.5, color: tokens.body, marginBottom: 4 }}
        >
          {name}
        </div>
        <div
          className="mono"
          style={{ fontSize: 10.5, color: tokens.muted, letterSpacing: '0.04em' }}
        >
          {theses.join(' · ')}
        </div>
      </div>
      <div
        className="mono nums"
        style={{
          fontSize: 18,
          color: pct >= 18 ? tokens.terracotta : tokens.amber,
          fontWeight: 700,
        }}
      >
        {pct}%
      </div>
    </div>
  );
}
