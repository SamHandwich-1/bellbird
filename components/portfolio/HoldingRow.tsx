'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { tokens } from '@/lib/tokens';
import { setCurrentPrice } from '@/app/(app)/portfolio/actions';
import type { Holding } from '@/lib/types';

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
    setDraft(
      holding.current_price != null ? String(holding.current_price) : '',
    );
    setEditing(true);
  }

  function commit() {
    if (pending) return;

    // Empty input — close editor with no DB write.
    if (draft.trim() === '') {
      setEditing(false);
      return;
    }

    const parsed = Number(draft);
    if (!Number.isFinite(parsed) || parsed < 0) {
      toast.error('Price must be a non-negative number.');
      return;
    }

    // No-op if value unchanged.
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
    pnlPct != null
      ? pnlPct >= 0
        ? tokens.sage
        : tokens.terracotta
      : tokens.whisper;
  const pnlSign = pnlPct != null && pnlPct >= 0 ? '+' : '';

  return (
    <div
      className="grid grid-cols-12 gap-3 items-baseline py-4 lift-on-hover"
      style={{ borderBottom: `1px solid ${tokens.surface}` }}
    >
      <div
        className="col-span-2 font-mono text-[14px]"
        style={{ color: tokens.ink, fontWeight: 500 }}
      >
        {holding.ticker}
      </div>

      <div
        className="col-span-4 font-sans text-[11px] tracking-[0.04em] truncate"
        style={{ color: tokens.whisper }}
        title={thesisName ?? undefined}
      >
        {thesisName && holding.thesis_id ? (
          <Link
            href={`/library/${holding.thesis_id}`}
            className="btn-quiet"
            style={{ color: tokens.whisper }}
          >
            {thesisName}
          </Link>
        ) : (
          <span>—</span>
        )}
      </div>

      <div
        className="col-span-1 font-mono text-[13px] text-right"
        style={{ color: tokens.ink }}
      >
        {holding.weight_pct.toFixed(1)}%
      </div>

      <div
        className="col-span-2 font-mono text-[12px] text-right"
        style={{ color: tokens.whisper }}
      >
        ${holding.avg_cost.toFixed(2)}
      </div>

      <div className="col-span-2 text-right">
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
            className="w-full bg-transparent text-right font-mono text-[12px]"
            style={{
              color: tokens.ink,
              outline: 'none',
              borderBottom: `1px solid ${tokens.hairline}`,
            }}
          />
        ) : (
          <button
            type="button"
            onClick={startEditing}
            className="font-mono text-[12px] text-right w-full"
            style={{
              color: holding.current_price != null ? tokens.ink : tokens.whisper,
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
        className="col-span-1 font-mono text-[13px] text-right flex items-center justify-end gap-1"
        style={{ color: pnlColor, fontWeight: 500 }}
      >
        {pnlPct != null ? (
          <>
            {pnlPct >= 0 ? (
              <TrendingUp size={10} strokeWidth={2} />
            ) : (
              <TrendingDown size={10} strokeWidth={2} />
            )}
            {pnlSign}
            {pnlPct.toFixed(1)}%
          </>
        ) : (
          <span>—</span>
        )}
      </div>
    </div>
  );
}
