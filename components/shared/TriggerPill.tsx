// Watch row trigger pill. Mockup: references/bellbird-mockup-v2-stack.jsx
//
// Renders an armed/fired/kill-armed count pill. Turn B passes no counts
// (triggers schema is item 7, deferred) so Watch never instantiates this in
// production. Component ships for the follow-up turn that wires triggers.

import { tokens } from '@/lib/tokens';

type Variant = 'armed' | 'fired' | 'kill';

export function TriggerPill({
  variant,
  count,
  label,
}: {
  variant: Variant;
  count: number;
  label: string;
}) {
  const color =
    variant === 'fired' ? tokens.terracotta : variant === 'kill' ? tokens.terracotta : tokens.muted;
  const filled = variant === 'fired' || variant === 'kill';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 8px',
        border: `1px solid ${color}40`,
        background: filled ? `${color}10` : 'transparent',
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color }} />
      <span
        className="mono"
        style={{
          fontSize: 9.5,
          color: filled ? color : tokens.muted,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        {count} {label}
      </span>
    </span>
  );
}
