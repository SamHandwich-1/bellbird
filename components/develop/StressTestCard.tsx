'use client';

import { Sparkles } from 'lucide-react';
import { tokens } from '@/lib/tokens';
import type { StressTest } from '@/lib/types';

export function StressTestCard({ stressTest }: { stressTest: StressTest }) {
  return (
    <div
      className="p-6"
      style={{ background: tokens.paper, border: `1px solid ${tokens.chime}` }}
    >
      <div
        className="font-sans text-[10px] tracking-[0.22em] uppercase mb-4 flex items-center gap-2"
        style={{ color: tokens.chime }}
      >
        <Sparkles size={11} strokeWidth={1.5} /> Phase 3 · Stress test · Grok-4
      </div>

      <div
        className="font-sans text-[10px] tracking-[0.16em] uppercase mb-2"
        style={{ color: tokens.whisper }}
      >
        Contrarian view
      </div>
      <p
        className="font-serif text-[15px] leading-[1.65] mb-6"
        style={{ fontWeight: 340, color: tokens.ink, maxWidth: '62ch' }}
      >
        {stressTest.contrarian_argument}
      </p>

      {stressTest.disagreement_matrix && stressTest.disagreement_matrix.length > 0 && (
        <>
          <div className="hairline my-4" />
          <div
            className="font-sans text-[10px] tracking-[0.16em] uppercase mb-3"
            style={{ color: tokens.whisper }}
          >
            Where models disagree
          </div>
          <div className="space-y-2">
            {stressTest.disagreement_matrix.map((row, i) => {
              const severityColor =
                row.severity === 'high'
                  ? tokens.terracotta
                  : row.severity === 'medium'
                    ? tokens.amber
                    : tokens.sage;
              return (
                <div
                  key={i}
                  className="grid grid-cols-12 gap-3 items-baseline font-sans text-[12px]"
                >
                  <div className="col-span-7" style={{ color: tokens.ash }}>
                    {row.claim}
                  </div>
                  <div
                    className="col-span-5 font-mono text-right text-[10px] tracking-[0.04em]"
                    style={{ color: severityColor }}
                  >
                    {row.claude_view} / {row.grok_view}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
