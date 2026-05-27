'use client';

// v2 trade entry modal. Ports the existing trade entry form into the
// dark-paper palette. Create + edit share this component.

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

function toDateInputValue(isoTimestamp: string): string {
  const d = new Date(isoTimestamp);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function fromDateInputValue(dateStr: string): string {
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
}: {
  onClose: () => void;
  theses: Pick<Thesis, 'id' | 'name'>[];
  initial?: Trade;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [ticker, setTicker] = useState(initial?.ticker ?? '');
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
  const [thesisId, setThesisId] = useState<string>(initial?.thesis_id ?? '');
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
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        overflowY: 'auto',
        padding: 24,
        background: 'rgba(0, 0, 0, 0.55)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 580,
          marginTop: 48,
          padding: 32,
          background: tokens.panel,
          border: `1px solid ${tokens.line}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 28,
          }}
        >
          <div className="label" style={{ color: tokens.muted }}>
            {initial ? 'Edit trade' : 'New trade'}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-quiet"
            aria-label="Close"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: tokens.muted,
              padding: 0,
            }}
          >
            <X size={14} strokeWidth={1.5} />
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <Grid cols={3}>
            <Field label="Ticker" span={2}>
              <Input
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                required
                autoFocus={!initial}
                placeholder="e.g. BHP.AX"
                disabled={pending}
                mono
              />
            </Field>
            <Field label="Side">
              <Select
                value={side}
                onChange={(e) => setSide(e.target.value as TradeSide)}
                disabled={pending}
              >
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
              </Select>
            </Field>
          </Grid>

          <Grid cols={3}>
            <Field label="Quantity">
              <Input
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                disabled={pending}
                mono
              />
            </Field>
            <Field label="Price (AUD)">
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                disabled={pending}
                mono
              />
            </Field>
            <Field label="Fees (AUD)">
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={fees}
                onChange={(e) => setFees(e.target.value)}
                disabled={pending}
                mono
              />
            </Field>
          </Grid>

          <Grid cols={2}>
            <Field label="Date">
              <Input
                type="date"
                value={executedAt}
                onChange={(e) => setExecutedAt(e.target.value)}
                required
                disabled={pending}
                mono
              />
            </Field>
            <Field label="Thesis (optional)">
              <Select
                value={thesisId}
                onChange={(e) => setThesisId(e.target.value)}
                disabled={pending}
              >
                <option value="">None</option>
                {theses.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </Field>
          </Grid>

          <Field label="Notes (optional)">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              disabled={pending}
              className="serif"
              style={{
                fontSize: 14.5,
                lineHeight: 1.5,
                width: '100%',
                background: 'transparent',
                paddingBottom: 6,
                resize: 'none',
                color: tokens.text,
                borderBottom: `1px solid ${tokens.line}`,
                outline: 'none',
                border: 'none',
                borderBottomWidth: 1,
                borderBottomStyle: 'solid',
              }}
            />
          </Field>

          <div style={{ display: 'flex', alignItems: 'center', gap: 24, paddingTop: 8 }}>
            <button
              type="submit"
              disabled={pending}
              className="label btn-quiet"
              style={{
                color: tokens.chime,
                borderBottom: `1px solid ${tokens.chime}`,
                paddingBottom: 4,
                background: 'transparent',
                border: 'none',
                borderBottomWidth: 1,
                borderBottomStyle: 'solid',
                cursor: pending ? 'wait' : 'pointer',
                opacity: pending ? 0.5 : 1,
              }}
            >
              {pending ? 'Saving' : initial ? 'Save changes' : 'Save trade'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="label btn-quiet"
              style={{
                color: tokens.muted,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Grid({ cols, children }: { cols: number; children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 22 }}>
      {children}
    </div>
  );
}

function Field({
  label,
  span,
  children,
}: {
  label: string;
  span?: number;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: 'block', gridColumn: span ? `span ${span}` : undefined }}>
      <div className="label" style={{ color: tokens.muted, marginBottom: 8 }}>
        {label}
      </div>
      {children}
    </label>
  );
}

function Input(
  props: React.InputHTMLAttributes<HTMLInputElement> & { mono?: boolean },
) {
  const { mono, style, ...rest } = props;
  return (
    <input
      {...rest}
      className={mono ? 'mono' : 'serif'}
      style={{
        fontSize: mono ? 15 : 15,
        width: '100%',
        background: 'transparent',
        paddingBottom: 6,
        color: tokens.text,
        borderBottom: `1px solid ${tokens.line}`,
        outline: 'none',
        border: 'none',
        borderBottomWidth: 1,
        borderBottomStyle: 'solid',
        ...style,
      }}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { children, style, ...rest } = props;
  return (
    <select
      {...rest}
      style={{
        fontSize: 14,
        width: '100%',
        background: tokens.panel,
        paddingBottom: 6,
        color: tokens.text,
        borderBottom: `1px solid ${tokens.line}`,
        outline: 'none',
        border: 'none',
        borderBottomWidth: 1,
        borderBottomStyle: 'solid',
        ...style,
      }}
    >
      {children}
    </select>
  );
}
