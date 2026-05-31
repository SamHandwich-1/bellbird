'use client';

// Watch row with expand-to-show-triggers behaviour. Mockup:
// references/bellbird-mockup-v2-stack.jsx (WatchMode / WatchRow).
//
// The thesis name itself is a <Link> with stopPropagation so clicking the
// title navigates to Library detail without toggling expand. The rest of
// the row body toggles. Gamma arrow + conviction delta render em-dashed
// pending item 9 (conviction history) — same as Turn B.

import { useState } from 'react';
import Link from 'next/link';
import { tokens, cycleStageColor, convictionColor, formatStage } from '@/lib/tokens';
import type { Trigger } from '@/lib/types';
import { TriggerPill } from './TriggerPill';
import { TriggerDetailRow } from './TriggerDetailRow';
import { GammaArrow } from './GammaArrow';

type WatchThesis = {
  id: string;
  name: string;
  cycle_stage: string | null;
  conviction: number;
  updated_at: string;
};

export function WatchRow({
  thesis,
  inPortfolio,
  triggers,
}: {
  thesis: WatchThesis;
  inPortfolio: boolean;
  triggers: Trigger[];
}) {
  const [expanded, setExpanded] = useState(false);

  // 'kill-armed' is derived (type='kill-on-sight' AND status='armed'), not a
  // status value. It's a subset of 'armed' — a thesis with one kill-on-sight
  // armed and two confirming armed shows 3 ARMED · 1 KILL-ARMED.
  const armed = triggers.filter((t) => t.status === 'armed').length;
  const fired = triggers.filter((t) => t.status === 'fired').length;
  const killArmed = triggers.filter(
    (t) => t.type === 'kill-on-sight' && t.status === 'armed',
  ).length;

  const conv = convictionColor(thesis.conviction);
  const cyc = cycleStageColor(thesis.cycle_stage as never);

  return (
    <div style={{ borderBottom: `1px solid ${tokens.line}` }}>
      <div
        onClick={() => setExpanded((v) => !v)}
        className="hairline-row"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto auto',
          gap: 24,
          padding: '22px 4px',
          alignItems: 'center',
          cursor: 'pointer',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
            <Link
              href={`/library/${thesis.id}`}
              onClick={(e) => e.stopPropagation()}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <h3
                className="serif"
                style={{
                  fontSize: 20,
                  fontWeight: 600,
                  color: tokens.text,
                  margin: 0,
                  letterSpacing: '-0.01em',
                }}
              >
                {thesis.name}
              </h3>
            </Link>
            {inPortfolio && (
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: tokens.chime,
                  boxShadow: `0 0 6px ${tokens.chime}aa`,
                }}
              />
            )}
          </div>
          <div
            style={{
              display: 'flex',
              gap: 14,
              marginBottom: 8,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            {thesis.cycle_stage && (
              <span className="label" style={{ color: cyc }}>
                {formatStage(thesis.cycle_stage).toLowerCase()}
              </span>
            )}
            <span
              className="mono"
              style={{ fontSize: 10, color: tokens.faint, letterSpacing: '0.06em' }}
            >
              UPDATED {formatShortDate(thesis.updated_at).toUpperCase()}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <TriggerPill variant="armed" count={armed} label="armed" />
            {fired > 0 && <TriggerPill variant="fired" count={fired} label="fired" />}
            {killArmed > 0 && (
              <TriggerPill variant="kill" count={killArmed} label="kill-armed" />
            )}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div className="label" style={{ color: tokens.faint, marginBottom: 4 }}>
            Gamma
          </div>
          <GammaArrow direction={null} />
        </div>

        <div style={{ textAlign: 'right', minWidth: 80 }}>
          <div
            className="mono nums"
            style={{ fontSize: 32, fontWeight: 700, color: conv, lineHeight: 1 }}
          >
            {thesis.conviction}
          </div>
          <div
            className="mono nums"
            style={{
              fontSize: 10,
              color: tokens.faint,
              marginTop: 4,
              letterSpacing: '0.04em',
            }}
            title="Conviction delta lands when conviction history ships"
          >
            — · 3MO
          </div>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '0 0 28px', background: tokens.panel }}>
          <div
            className="label"
            style={{
              color: tokens.faint,
              padding: '14px 16px 10px',
              borderTop: `1px solid ${tokens.line}`,
            }}
          >
            Triggers · per thesis
          </div>
          {triggers.length === 0 ? (
            <p
              className="serif"
              style={{
                fontSize: 13,
                fontStyle: 'italic',
                color: tokens.muted,
                padding: '4px 16px 16px',
                margin: 0,
              }}
            >
              No triggers yet. Add some from the thesis detail page.
            </p>
          ) : (
            triggers.map((t) => <TriggerDetailRow key={t.id} trigger={t} />)
          )}
        </div>
      )}
    </div>
  );
}

function formatShortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}
