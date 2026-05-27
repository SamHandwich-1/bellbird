'use client';

// Portfolio holdings row. v2 rebuild of the v1 HoldingRow with two fixes:
//  1. Share-count column added between weight and avg cost.
//  2. Tokens migrated off legacy aliases.
//
// Inline editor for current_price preserved as in v1.

import { useState, useRef, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { tokens, convictionColor } from '@/lib/tokens';
import { setCurrentPrice } from '@/app/(app)/portfolio/actions';
import type { Holding } from '@/lib/types';

void convictionColor; // avoid unused-import noise if we drop the helper later

export function HoldingRow({
  holding,
  thesisName,
}: {
  holding: Holding;
  thesisName: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  function startEditing() {
    setDraft(holding.current_price != null ? String(holding.current_price) : '');
    setEditing(true);
  }

  function commit() {
    if (pending) return;
    if (draft.trim() === '') {
      setEditing(false);
      return;
    }
    const parsed = Number(draft);
    if (!Number.isFinite(parsed) || parsed < 0) {
      toast.error('Price must be a non-negative number.');
      return;
    }
    if (parsed === holding.current_price) {
      setEditing(false);
      return;
    }
    startTransition(async () => {
      const result = await setCurrentPrice(holding.ticker, parsed);
      if ('error' in result) {
        toast.error(result.error);
        return;
      }
      toast.success(`${holding.ticker} price updated.`);
      setEditing(false);
      router.refresh();
    });
  }

  function cancel() {
    setEditing(false);
    setDraft('');
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancel();
    }
  }

  const pnlPct = holding.unrealized_pnl_pct;
  const pnlColor =
    pnlPct != null ? (pnlPct >= 0 ? tokens.sage : tokens.terracotta) : tokens.faint;
  const pnlSign = pnlPct != null && pnlPct >= 0 ? '+' : '';

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '70px 1fr 70px 70px 90px 90px 70px',
        gap: 12,
        padding: '14px 0',
        alignItems: 'baseline',
        borderBottom: `1px solid ${tokens.line}`,
      }}
      className="hairline-row"
    >
      <div className="mono" style={{ fontSize: 14, fontWeight: 600, color: tokens.text }}>
        {holding.ticker}
      </div>

      <div
        className="sans"
        style={{
          fontSize: 11,
          color: tokens.muted,
          letterSpacing: '0.04em',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        title={thesisName ?? undefined}
      >
        {thesisName && holding.thesis_id ? (
          <Link
            href={`/library/${holding.thesis_id}`}
            className="btn-quiet"
            style={{ color: tokens.muted, textDecoration: 'none' }}
          >
            {thesisName}
          </Link>
        ) : (
          <span>—</span>
        )}
      </div>

      <div
        className="mono nums"
        style={{ fontSize: 12.5, textAlign: 'right', color: tokens.text }}
      >
        {holding.weight_pct.toFixed(1)}%
      </div>

      <div
        className="mono nums"
        style={{ fontSize: 12.5, textAlign: 'right', color: tokens.body }}
        title={`${holding.net_quantity} shares`}
      >
        {holding.net_quantity}
      </div>

      <div
        className="mono nums"
        style={{ fontSize: 12.5, textAlign: 'right', color: tokens.muted }}
      >
        ${holding.avg_cost.toFixed(2)}
      </div>

      <div style={{ textAlign: 'right' }}>
        {editing ? (
          <input
            ref={inputRef}
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={onKeyDown}
            disabled={pending}
            style={{
              width: '100%',
              background: 'transparent',
              textAlign: 'right',
              color: tokens.text,
              outline: 'none',
              borderBottom: `1px solid ${tokens.hairline}`,
              fontFamily: 'JetBrains Mono, ui-monospace, monospace',
              fontSize: 12.5,
              border: 'none',
              borderBottomWidth: 1,
              borderBottomStyle: 'solid',
            }}
          />
        ) : (
          <button
            type="button"
            onClick={startEditing}
            className="btn-quiet"
            style={{
              fontFamily: 'JetBrains Mono, ui-monospace, monospace',
              fontSize: 12.5,
              textAlign: 'right',
              width: '100%',
              color: holding.current_price != null ? tokens.text : tokens.faint,
              cursor: 'text',
              background: 'transparent',
              border: 'none',
              padding: 0,
            }}
            aria-label={`Set current price for ${holding.ticker}`}
          >
            {holding.current_price != null
              ? `$${holding.current_price.toFixed(2)}`
              : '—'}
          </button>
        )}
      </div>

      <div
        className="mono nums"
        style={{
          fontSize: 13,
          textAlign: 'right',
          color: pnlColor,
          fontWeight: 600,
        }}
      >
        {pnlPct != null ? `${pnlSign}${pnlPct.toFixed(1)}%` : '—'}
      </div>
    </div>
  );
}

export function HoldingsHeader() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '70px 1fr 70px 70px 90px 90px 70px',
        gap: 12,
        padding: '10px 0',
        borderBottom: `1px solid ${tokens.line}`,
      }}
    >
      <div className="label" style={{ color: tokens.faint }}>
        Ticker
      </div>
      <div className="label" style={{ color: tokens.faint }}>
        Thesis
      </div>
      <div className="label" style={{ color: tokens.faint, textAlign: 'right' }}>
        Weight
      </div>
      <div className="label" style={{ color: tokens.faint, textAlign: 'right' }}>
        Shares
      </div>
      <div className="label" style={{ color: tokens.faint, textAlign: 'right' }}>
        Avg cost
      </div>
      <div className="label" style={{ color: tokens.faint, textAlign: 'right' }}>
        Current
      </div>
      <div className="label" style={{ color: tokens.faint, textAlign: 'right' }}>
        P/L
      </div>
    </div>
  );
}
