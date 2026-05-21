'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { tokens } from '@/lib/tokens';
import type { Thesis, Trade, TradeSide } from '@/lib/types';
import {
  createTrade,
  updateTrade,
  type TradeInput,
} from '@/app/(app)/portfolio/actions';

export type TradePrefill = {
  ticker?: string;
  thesis_id?: string | null;
};

// Local-timezone-aware conversions between the form's YYYY-MM-DD date input
// and the trades.executed_at TIMESTAMPTZ column.
function toDateInputValue(isoTimestamp: string): string {
  const d = new Date(isoTimestamp);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function fromDateInputValue(dateStr: string): string {
  // Interpret as local midnight, then serialise — keeps the date the user
  // typed regardless of UTC offset.
  return new Date(`${dateStr}T00:00:00`).toISOString();
}

function todayLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function TradeEntryModal({
  onClose,
  theses,
  initial,
  prefill,
}: {
  onClose: () => void;
  theses: Pick<Thesis, 'id' | 'name'>[];
  initial?: Trade;
  prefill?: TradePrefill;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [ticker, setTicker] = useState(
    initial?.ticker ?? prefill?.ticker ?? '',
  );
  const [side, setSide] = useState<TradeSide>(initial?.side ?? 'buy');
  const [quantity, setQuantity] = useState(
    initial?.quantity != null ? String(initial.quantity) : '',
  );
  const [price, setPrice] = useState(
    initial?.price != null ? String(initial.price) : '',
  );
  const [fees, setFees] = useState(
    initial?.fees != null ? String(initial.fees) : '0',
  );
  const [executedAt, setExecutedAt] = useState(
    initial ? toDateInputValue(initial.executed_at) : todayLocal(),
  );
  const [thesisId, setThesisId] = useState<string>(
    initial?.thesis_id ?? prefill?.thesis_id ?? '',
  );
  const [notes, setNotes] = useState(initial?.notes ?? '');

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      const payload: TradeInput = {
        thesis_id: thesisId === '' ? null : thesisId,
        ticker: ticker.trim(),
        side,
        quantity: Number(quantity),
        price: Number(price),
        fees: Number(fees) || 0,
        executed_at: fromDateInputValue(executedAt),
        notes: notes.trim() || null,
      };
      const result = initial
        ? await updateTrade(initial.id, payload)
        : await createTrade(payload);
      if ('error' in result) {
        toast.error(result.error);
        return;
      }
      toast.success(initial ? 'Trade updated.' : 'Trade saved.');
      onClose();
      router.refresh();
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-6"
      style={{ background: 'rgba(26, 26, 26, 0.32)' }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl my-12 p-8"
        style={{ background: tokens.paper, border: `1px solid ${tokens.hairline}` }}
      >
        <div className="flex items-center justify-between mb-8">
          <div
            className="font-sans text-[10px] tracking-[0.22em] uppercase"
            style={{ color: tokens.whisper }}
          >
            {initial ? 'Edit trade' : 'New trade'}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-quiet text-whisper"
            aria-label="Close"
          >
            <X size={14} strokeWidth={1.5} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-3 gap-6">
            <Field label="Ticker" className="col-span-2">
              <input
                required
                autoFocus={!initial && !prefill?.ticker}
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                placeholder="e.g. BHP.AX"
                className="font-mono text-[18px] w-full bg-transparent pb-2"
                style={{
                  color: tokens.ink,
                  borderBottom: `1px solid ${tokens.hairline}`,
                  outline: 'none',
                }}
                disabled={pending}
              />
            </Field>
            <Field label="Side">
              <select
                value={side}
                onChange={(e) => setSide(e.target.value as TradeSide)}
                className="font-sans text-[13px] tracking-[0.1em] uppercase w-full bg-transparent pb-2"
                style={{
                  color: tokens.ink,
                  borderBottom: `1px solid ${tokens.hairline}`,
                  outline: 'none',
                }}
                disabled={pending}
              >
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <Field label="Quantity">
              <input
                required
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="font-mono text-[16px] w-full bg-transparent pb-2"
                style={{
                  color: tokens.ink,
                  borderBottom: `1px solid ${tokens.hairline}`,
                  outline: 'none',
                }}
                disabled={pending}
              />
            </Field>
            <Field label="Price (AUD)">
              <input
                required
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="font-mono text-[16px] w-full bg-transparent pb-2"
                style={{
                  color: tokens.ink,
                  borderBottom: `1px solid ${tokens.hairline}`,
                  outline: 'none',
                }}
                disabled={pending}
              />
            </Field>
            <Field label="Fees (AUD)">
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={fees}
                onChange={(e) => setFees(e.target.value)}
                className="font-mono text-[16px] w-full bg-transparent pb-2"
                style={{
                  color: tokens.ink,
                  borderBottom: `1px solid ${tokens.hairline}`,
                  outline: 'none',
                }}
                disabled={pending}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <Field label="Date">
              <input
                required
                type="date"
                value={executedAt}
                onChange={(e) => setExecutedAt(e.target.value)}
                className="font-mono text-[14px] w-full bg-transparent pb-2"
                style={{
                  color: tokens.ink,
                  borderBottom: `1px solid ${tokens.hairline}`,
                  outline: 'none',
                }}
                disabled={pending}
              />
            </Field>
            <Field label="Thesis (optional)">
              <select
                value={thesisId}
                onChange={(e) => setThesisId(e.target.value)}
                className="font-sans text-[13px] w-full bg-transparent pb-2"
                style={{
                  color: tokens.ink,
                  borderBottom: `1px solid ${tokens.hairline}`,
                  outline: 'none',
                }}
                disabled={pending}
              >
                <option value="">None</option>
                {theses.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Notes (optional)">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="font-serif text-[15px] leading-[1.5] w-full bg-transparent pb-2 resize-none"
              style={{
                fontWeight: 340,
                color: tokens.ink,
                borderBottom: `1px solid ${tokens.hairline}`,
                outline: 'none',
              }}
              disabled={pending}
            />
          </Field>

          <div className="flex items-center gap-6 pt-4">
            <button
              type="submit"
              disabled={pending}
              className="font-sans text-[10px] tracking-[0.22em] uppercase btn-quiet"
              style={{
                color: tokens.ink,
                borderBottom: `1px solid ${tokens.ink}`,
                paddingBottom: 4,
                opacity: pending ? 0.5 : 1,
              }}
            >
              {pending ? 'Saving' : initial ? 'Save changes' : 'Save trade'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="font-sans text-[10px] tracking-[0.22em] uppercase btn-quiet"
              style={{ color: tokens.whisper }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className ?? ''}`}>
      <div
        className="font-sans text-[10px] tracking-[0.22em] uppercase mb-3"
        style={{ color: tokens.whisper }}
      >
        {label}
      </div>
      {children}
    </label>
  );
}
