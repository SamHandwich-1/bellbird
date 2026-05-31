// Trigger detail row. Mockup: references/bellbird-mockup-v2-stack.jsx (Watch
// expanded panel). Used identically on Watch (read-only) and Library detail
// (with edit/delete affordances via the optional `actions` slot).
//
// Pure presentational, server-component-safe.

import { tokens } from '@/lib/tokens';
import type { Trigger, TriggerType } from '@/lib/types';

// Domain TriggerType → palette colour. 'kill-on-sight' maps to the 'kill'
// colour token (the token key uses the shorter name).
const TYPE_COLOUR: Record<TriggerType, string> = {
  confirming: tokens.confirming,
  disconfirming: tokens.disconfirming,
  'kill-on-sight': tokens.kill,
};

// Type label shown in the row's left column. 'kill-on-sight' renders as 'kill'
// to match the mockup's compact width (90px column).
const TYPE_LABEL: Record<TriggerType, string> = {
  confirming: 'confirming',
  disconfirming: 'disconfirming',
  'kill-on-sight': 'kill',
};

export function TriggerDetailRow({
  trigger,
  actions,
}: {
  trigger: Trigger;
  actions?: React.ReactNode;
}) {
  const typeColour = TYPE_COLOUR[trigger.type];
  const statusColour = trigger.status === 'fired' ? tokens.terracotta : tokens.faint;

  const signalThreshold = [trigger.monitoring_signal, trigger.threshold]
    .filter(Boolean)
    .join(' · ');

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: actions ? '90px 1fr auto auto' : '90px 1fr auto',
        gap: 16,
        padding: '12px 16px',
        borderTop: `1px solid ${tokens.line}`,
        alignItems: 'baseline',
      }}
    >
      <span className="label" style={{ color: typeColour }}>
        {TYPE_LABEL[trigger.type]}
      </span>
      <div>
        <div className="serif" style={{ fontSize: 13.5, color: tokens.body, marginBottom: 4 }}>
          {trigger.description}
        </div>
        {signalThreshold && (
          <div
            className="mono"
            style={{ fontSize: 10.5, color: tokens.muted, letterSpacing: '0.03em' }}
          >
            {signalThreshold}
          </div>
        )}
      </div>
      <span className="label" style={{ color: statusColour }}>
        {trigger.status}
      </span>
      {actions}
    </div>
  );
}
