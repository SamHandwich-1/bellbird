// Phase 3 stress-test card, v2 styling.

import { Sparkles } from 'lucide-react';
import { tokens } from '@/lib/tokens';
import type { StressTest } from '@/lib/types';

export function StressTestCard({ stressTest }: { stressTest: StressTest }) {
  return (
    <div
      style={{
        background: tokens.panel,
        border: `1px solid ${tokens.line}`,
        padding: 24,
        marginBottom: 24,
      }}
    >
      <div
        className="label"
        style={{
          color: tokens.chime,
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <Sparkles size={11} strokeWidth={1.5} /> Phase 3 · Stress test · Grok-4
      </div>

      <div className="label" style={{ color: tokens.muted, marginBottom: 8 }}>
        Contrarian view
      </div>
      <p
        className="serif"
        style={{
          fontSize: 15,
          lineHeight: 1.65,
          color: tokens.body,
          margin: '0 0 22px',
          maxWidth: '60ch',
        }}
      >
        {stressTest.contrarian_argument}
      </p>

      {stressTest.disagreement_matrix && stressTest.disagreement_matrix.length > 0 && (
        <div style={{ paddingTop: 14, borderTop: `1px solid ${tokens.line}` }}>
          <div className="label" style={{ color: tokens.muted, marginBottom: 12 }}>
            Where models disagree
          </div>
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
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: 12,
                  padding: '10px 0',
                  borderBottom: `1px solid ${tokens.line}`,
                  alignItems: 'baseline',
                }}
              >
                <span className="sans" style={{ fontSize: 13, color: tokens.body, lineHeight: 1.55 }}>
                  {row.claim}
                </span>
                <span
                  className="mono"
                  style={{
                    fontSize: 10.5,
                    color: severityColor,
                    letterSpacing: '0.04em',
                    textAlign: 'right',
                  }}
                >
                  {row.claude_view} / {row.grok_view}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
