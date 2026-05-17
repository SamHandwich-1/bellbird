'use client';

import { tokens } from '@/lib/tokens';

const PHASES = [
  { id: 1, label: 'Develop', model: 'Opus 4.7' },
  { id: 2, label: 'Structure', model: 'Sonnet 4.6' },
  { id: 3, label: 'Stress', model: 'Grok-4' },
  { id: 4, label: 'Adjudicate', model: 'Opus 4.7' },
] as const;

export type Phase = 1 | 2 | 3 | 4;

export function PhaseProgression({
  active,
  highestReached,
}: {
  active: Phase;
  highestReached: Phase;
}) {
  return (
    <div className="flex items-center gap-4 flex-wrap mb-6">
      {PHASES.map((p, i) => {
        const isActive = p.id === active;
        const isReached = p.id <= highestReached;
        return (
          <div key={p.id} className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: isActive
                    ? tokens.chime
                    : isReached
                      ? tokens.ash
                      : 'transparent',
                  border: `1px solid ${isReached ? tokens.ash : tokens.fade}`,
                }}
              />
              <span
                className="font-sans text-[10px] tracking-[0.22em] uppercase"
                style={{
                  color: isActive ? tokens.ink : isReached ? tokens.ash : tokens.whisper,
                }}
              >
                {p.label}
              </span>
              {isActive && (
                <span
                  className="font-sans text-[10px] tracking-[0.06em]"
                  style={{ color: tokens.chime }}
                >
                  · {p.model}
                </span>
              )}
            </div>
            {i < PHASES.length - 1 && (
              <span style={{ color: tokens.fade, fontSize: 11 }}>›</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
