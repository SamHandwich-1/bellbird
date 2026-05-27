'use client';

// Develop chat voice toggle. Item 1 (Whisper) end-to-end wiring is deferred to
// its own follow-up turn. Turn B ships UI chrome only — click fires a "coming
// soon" toast. The `active` state is locally toggleable so the pulse-glow
// animation can be inspected; no actual recording happens.
//
// Mockup: references/bellbird-mockup-v2-stack.jsx

import { useState } from 'react';
import { toast } from 'sonner';
import { tokens } from '@/lib/tokens';

export function VoiceButton() {
  const [active, setActive] = useState(false);

  function onClick() {
    setActive((v) => !v);
    toast.info('Voice input coming soon', {
      description: 'Whisper integration is queued as its own follow-up turn.',
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: 38,
        height: 38,
        borderRadius: 2,
        background: active ? tokens.chime : 'transparent',
        border: `1.5px solid ${active ? tokens.chime : tokens.line}`,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 200ms ease',
        animation: active ? 'pulse-glow 1.4s ease-in-out infinite' : 'none',
        flexShrink: 0,
      }}
      title={active ? 'Tap to stop recording (coming soon)' : 'Tap to start recording (coming soon)'}
      aria-label="Voice input — coming soon"
    >
      <svg width="14" height="18" viewBox="0 0 14 18" fill="none">
        <rect
          x="4"
          y="0.5"
          width="6"
          height="10"
          rx="3"
          stroke={active ? tokens.bg : tokens.muted}
          strokeWidth="1.5"
        />
        <path
          d="M1 8.5C1 11.8 3.7 14.5 7 14.5C10.3 14.5 13 11.8 13 8.5"
          stroke={active ? tokens.bg : tokens.muted}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <line
          x1="7"
          y1="14.5"
          x2="7"
          y2="17.5"
          stroke={active ? tokens.bg : tokens.muted}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
