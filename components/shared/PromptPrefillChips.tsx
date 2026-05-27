'use client';

// Item 15: prompt prefill chips beneath the most recent Opus bubble. The
// chips are parsed from a trailing <suggestions> block that Phase 1 Opus is
// instructed to append (see lib/develop/suggestions.ts and the additive line
// in the Phase 1 system prompt).
//
// Clicking a chip pre-fills the textarea via onPick — the parent owns the
// input state.

import { tokens } from '@/lib/tokens';

export function PromptPrefillChips({
  suggestions,
  onPick,
}: {
  suggestions: string[];
  onPick: (suggestion: string) => void;
}) {
  if (suggestions.length === 0) return null;
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: -8,
        marginBottom: 20,
        marginLeft: 0,
      }}
    >
      {suggestions.map((s, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onPick(s)}
          className="btn-quiet"
          style={{
            background: 'transparent',
            border: `1px solid ${tokens.line}`,
            color: tokens.body,
            padding: '5px 10px',
            cursor: 'pointer',
            fontFamily: 'Manrope, system-ui, sans-serif',
            fontSize: 11.5,
            lineHeight: 1.3,
            textAlign: 'left',
          }}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
