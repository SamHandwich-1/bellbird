// Portfolio horizontal allocation bar. Mockup:
// references/bellbird-mockup-v2-stack.jsx
//
// Stacked horizontal bar coloured by cycle stage, with a cash slice at the
// end. Sizes from thesis weights (passed in pre-computed).

import { tokens, cycleStageColor } from '@/lib/tokens';
import type { CycleStage } from '@/lib/types';

type Slice = {
  id: string;
  name: string;
  weight: number;            // percentage 0-100
  cycle_stage: CycleStage | null;
};

export function AllocationBar({
  slices,
  cashPct,
}: {
  slices: Slice[];
  cashPct: number;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          display: 'flex',
          height: 32,
          border: `1px solid ${tokens.line}`,
          overflow: 'hidden',
        }}
      >
        {slices.map((s) => (
          <div
            key={s.id}
            title={`${s.name}: ${s.weight.toFixed(1)}%`}
            style={{
              width: `${s.weight}%`,
              background: cycleStageColor(s.cycle_stage),
              opacity: 0.85,
              borderRight: `1px solid ${tokens.bg}`,
            }}
          />
        ))}
        {cashPct > 0 && (
          <div
            title={`Cash: ${cashPct.toFixed(1)}%`}
            style={{
              width: `${cashPct}%`,
              background: tokens.hairline,
            }}
          />
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <span
          className="mono"
          style={{ fontSize: 9.5, color: tokens.faint, letterSpacing: '0.06em' }}
        >
          0%
        </span>
        <span
          className="mono"
          style={{ fontSize: 9.5, color: tokens.faint, letterSpacing: '0.06em' }}
        >
          50%
        </span>
        <span
          className="mono"
          style={{ fontSize: 9.5, color: tokens.faint, letterSpacing: '0.06em' }}
        >
          100%
        </span>
      </div>
    </div>
  );
}
