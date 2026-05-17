'use client';

import { cycleStageColor, formatStage, tokens } from '@/lib/tokens';
import type { StructuredThesis } from '@/lib/ai/schemas';

export function StructuredDraftCard({ draft }: { draft: StructuredThesis }) {
  return (
    <div
      className="p-6"
      style={{ background: tokens.mist, border: `1px solid ${tokens.hairline}` }}
    >
      <div
        className="font-sans text-[10px] tracking-[0.22em] uppercase mb-4"
        style={{ color: tokens.chime }}
      >
        Phase 2 · Structured draft
      </div>

      <h3
        className="font-serif text-[28px] tracking-tight mb-2"
        style={{ fontWeight: 380 }}
      >
        {draft.name}
      </h3>

      <div
        className="font-sans text-[11px] tracking-[0.06em] flex flex-wrap items-center gap-x-3 mb-4"
        style={{ color: tokens.ash }}
      >
        <span>{draft.sector}</span>
        <span style={{ color: tokens.fade }}>·</span>
        <span
          className="uppercase tracking-[0.16em] text-[10px]"
          style={{ color: cycleStageColor(draft.cycle_stage) }}
        >
          {formatStage(draft.cycle_stage)}
        </span>
        <span style={{ color: tokens.fade }}>·</span>
        <span className="font-mono text-[11px]">{draft.conviction}%</span>
        <span style={{ color: tokens.fade }}>·</span>
        <span>{draft.timing}</span>
      </div>

      <p
        className="font-serif text-[15px] leading-[1.6] mb-4"
        style={{ fontWeight: 340, color: tokens.ink, maxWidth: '62ch' }}
      >
        {draft.summary}
      </p>

      {draft.hedge_note && (
        <p
          className="font-serif text-[13px] leading-[1.6] italic mb-4"
          style={{ fontWeight: 340, color: tokens.ash, maxWidth: '62ch' }}
        >
          Hedge: {draft.hedge_note}
        </p>
      )}

      <div className="hairline my-4" />

      <div
        className="font-sans text-[10px] tracking-[0.22em] uppercase mb-3"
        style={{ color: tokens.whisper }}
      >
        Positions · <span className="font-mono">{draft.positions.length}</span>
      </div>
      <div className="space-y-2">
        {draft.positions.map((p, i) => (
          <div
            key={`${p.ticker}-${i}`}
            className="grid grid-cols-12 gap-3 items-baseline font-sans text-[12px]"
          >
            <div className="col-span-2 font-mono" style={{ color: tokens.ink }}>
              {p.ticker}
            </div>
            <div className="col-span-3" style={{ color: tokens.ash }}>
              {p.name}
            </div>
            <div
              className="col-span-1 font-mono text-right"
              style={{ color: tokens.ink }}
            >
              {p.weight}%
            </div>
            <div
              className="col-span-1 text-right uppercase tracking-[0.06em] text-[10px]"
              style={{ color: tokens.whisper }}
            >
              {p.side}
            </div>
            <div className="col-span-5" style={{ color: tokens.ash }}>
              {p.notes}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
