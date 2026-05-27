// Watch row directional-gamma indicator. Mockup: references/bellbird-mockup-v2-stack.jsx
//
// When direction is null/undefined (Turn B default — gamma data depends on
// conviction history) renders an em-dash so the row visibly indicates
// "no data yet" rather than picking a fake direction.

import { tokens } from '@/lib/tokens';

type Direction = 'rising' | 'falling' | 'flat' | null | undefined;

export function GammaArrow({ direction }: { direction: Direction }) {
  if (!direction) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          justifyContent: 'flex-end',
        }}
      >
        <span
          className="mono nums"
          style={{ fontSize: 22, color: tokens.faint, lineHeight: 1, fontWeight: 600 }}
        >
          —
        </span>
      </div>
    );
  }

  const color =
    direction === 'rising' ? tokens.sage : direction === 'falling' ? tokens.terracotta : tokens.faint;
  const symbol = direction === 'rising' ? '↑' : direction === 'falling' ? '↓' : '→';
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        justifyContent: 'flex-end',
      }}
    >
      <span
        className="mono nums"
        style={{ fontSize: 22, color, lineHeight: 1, fontWeight: 600 }}
      >
        {symbol}
      </span>
      <span
        className="mono"
        style={{
          fontSize: 10,
          color,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        {direction}
      </span>
    </div>
  );
}
