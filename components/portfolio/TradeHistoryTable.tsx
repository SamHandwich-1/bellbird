'use client';

import { useState } from 'react';
import { tokens } from '@/lib/tokens';
import type { Trade, Thesis } from '@/lib/types';
import { TradeEntryModal } from './TradeEntryModal';
import { EditTradeButton } from './EditTradeButton';
import { DeleteTradeButton } from './DeleteTradeButton';

export function TradeHistoryTable({
  trades,
  theses,
}: {
  trades: Trade[];
  theses: Pick<Thesis, 'id' | 'name'>[];
}) {
  if (trades.length === 0) return null;

  return (
    <section>
      <div
        className="font-sans text-[10px] tracking-[0.22em] uppercase mb-6"
        style={{ color: tokens.whisper }}
      >
        Trade history · <span className="font-mono">{trades.length}</span>
      </div>
      <div
        className="grid grid-cols-12 gap-3 font-sans text-[10px] tracking-[0.16em] uppercase py-3"
        style={{ color: tokens.fade }}
      >
        <div className="col-span-2">Date</div>
        <div className="col-span-2">Ticker</div>
        <div className="col-span-1">Side</div>
        <div className="col-span-1 text-right">Qty</div>
        <div className="col-span-1 text-right">Price</div>
        <div className="col-span-1 text-right">Fees</div>
        <div className="col-span-4">Thesis</div>
      </div>
      <div className="hairline" />
      {trades.map((t) => (
        <TradeHistoryRow key={t.id} trade={t} theses={theses} />
      ))}
    </section>
  );
}

function TradeHistoryRow({
  trade,
  theses,
}: {
  trade: Trade;
  theses: Pick<Thesis, 'id' | 'name'>[];
}) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // Mirrors the ConversationListRow pattern (commit af0670c).
  // Cells fade out whenever affordances are visible: hover OR confirming.
  const cellHideClasses = confirming
    ? 'opacity-0 transition-opacity'
    : 'transition-opacity group-hover:opacity-0';

  // Affordances visible: hover OR sticky-confirming. Never visible while
  // editing (the modal is the active surface).
  const affordanceClasses = confirming
    ? 'opacity-100 pointer-events-auto'
    : 'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto';

  const thesisName = trade.thesis_id
    ? theses.find((t) => t.id === trade.thesis_id)?.name ?? trade.thesis_id
    : null;

  const dateStr = new Date(trade.executed_at).toLocaleDateString('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const sideColor = trade.side === 'buy' ? tokens.sage : tokens.terracotta;

  return (
    <div
      className="group relative grid grid-cols-12 gap-3 items-baseline py-3"
      style={{ borderBottom: `1px solid ${tokens.surface}` }}
    >
      <div
        className="col-span-2 font-mono text-[11px]"
        style={{ color: tokens.whisper }}
      >
        {dateStr}
      </div>
      <div
        className="col-span-2 font-mono text-[13px]"
        style={{ color: tokens.ink, fontWeight: 500 }}
      >
        {trade.ticker}
      </div>
      <div
        className="col-span-1 font-sans text-[10px] tracking-[0.16em] uppercase"
        style={{ color: sideColor }}
      >
        {trade.side}
      </div>
      <div
        className="col-span-1 font-mono text-[12px] text-right"
        style={{ color: tokens.ink }}
      >
        {trade.quantity}
      </div>
      <div
        className="col-span-1 font-mono text-[12px] text-right"
        style={{ color: tokens.ink }}
      >
        ${trade.price.toFixed(2)}
      </div>
      <div
        className="col-span-1 font-mono text-[11px] text-right"
        style={{ color: tokens.whisper }}
      >
        ${(trade.fees ?? 0).toFixed(2)}
      </div>
      <div
        className={`col-span-4 font-sans text-[11px] tracking-[0.04em] truncate ${cellHideClasses}`}
        style={{ color: tokens.whisper }}
        title={thesisName ?? undefined}
      >
        {thesisName ?? '—'}
      </div>

      {/* Hover-revealed action overlay */}
      {!editing && (
        <div
          className={`absolute right-0 top-0 bottom-0 flex items-center gap-4 pr-2 transition-opacity ${affordanceClasses}`}
        >
          {!confirming && (
            <EditTradeButton onClick={() => setEditing(true)} />
          )}
          <DeleteTradeButton
            tradeId={trade.id}
            onConfirmingChange={setConfirming}
          />
        </div>
      )}

      {editing && (
        <TradeEntryModal
          theses={theses}
          initial={trade}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}
