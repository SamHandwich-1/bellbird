'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Position, PositionSide } from '@/lib/types';
import {
  createPosition,
  updatePosition,
  deletePosition,
} from '@/app/(app)/library/actions';
import { tokens } from '@/lib/tokens';

const SIDES: PositionSide[] = ['long', 'short', 'hedge'];

export function PositionEditor({
  thesisId,
  positions,
}: {
  thesisId: string;
  positions: Position[];
}) {
  return (
    <div>
      <div className="grid grid-cols-12 gap-3 font-sans text-[10px] tracking-[0.16em] uppercase py-3" style={{ color: tokens.fade }}>
        <div className="col-span-2">Ticker</div>
        <div className="col-span-3">Name</div>
        <div className="col-span-1 text-right">Weight</div>
        <div className="col-span-1 text-right">Side</div>
        <div className="col-span-1 text-right">Upside</div>
        <div className="col-span-3">Notes</div>
        <div className="col-span-1"></div>
      </div>
      <div className="hairline" />
      {positions.map((p) => (
        <PositionRow key={p.id} position={p} />
      ))}
      <NewPositionRow thesisId={thesisId} nextOrder={positions.length} />
    </div>
  );
}

function PositionRow({ position }: { position: Position }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [ticker, setTicker] = useState(position.ticker);
  const [name, setName] = useState(position.name);
  const [weight, setWeight] = useState(String(position.weight));
  const [side, setSide] = useState<PositionSide>(position.side);
  const [upside, setUpside] = useState(position.upside == null ? '' : String(position.upside));
  const [notes, setNotes] = useState(position.notes ?? '');

  function save() {
    const trimmedTicker = ticker.trim();
    const trimmedName = name.trim();
    const numWeight = Number(weight) || 0;
    const numUpside = upside === '' ? null : Number(upside);
    const trimmedNotes = notes.trim() || null;

    const unchanged =
      trimmedTicker === position.ticker &&
      trimmedName === position.name &&
      numWeight === Number(position.weight) &&
      side === position.side &&
      numUpside === position.upside &&
      trimmedNotes === (position.notes ?? null);

    if (unchanged) return;

    startTransition(async () => {
      const result = await updatePosition(position.id, {
        ticker: trimmedTicker,
        name: trimmedName,
        weight: numWeight,
        side,
        upside: numUpside,
        notes: trimmedNotes,
      });
      if ('error' in result) {
        toast.error(result.error);
        return;
      }
      toast.success('Position updated.');
      router.refresh();
    });
  }

  function remove() {
    if (!confirm(`Delete position ${position.ticker}?`)) return;
    startTransition(async () => {
      const result = await deletePosition(position.id, position.thesis_id);
      if ('error' in result) toast.error(result.error);
      else {
        toast.success('Position deleted.');
        router.refresh();
      }
    });
  }

  return (
    <div
      className="grid grid-cols-12 gap-3 items-center py-3"
      style={{ borderBottom: `1px solid ${tokens.surface}` }}
    >
      <input
        className="col-span-2 font-mono text-[13px] bg-transparent"
        value={ticker}
        onChange={(e) => setTicker(e.target.value)}
        onBlur={save}
        disabled={pending}
        style={{ color: tokens.ink, outline: 'none' }}
      />
      <input
        className="col-span-3 font-sans text-[13px] bg-transparent"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={save}
        disabled={pending}
        style={{ color: tokens.ash, outline: 'none' }}
      />
      <input
        className="col-span-1 font-mono text-[13px] bg-transparent text-right"
        type="number"
        step="0.1"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        onBlur={save}
        disabled={pending}
        style={{ color: tokens.ink, outline: 'none' }}
      />
      <select
        className="col-span-1 font-sans text-[11px] tracking-[0.06em] uppercase bg-transparent text-right"
        value={side}
        onChange={(e) => {
          const newSide = e.target.value as PositionSide;
          setSide(newSide);
          if (newSide === position.side) return;
          startTransition(async () => {
            const result = await updatePosition(position.id, {
              ticker: ticker.trim(),
              name: name.trim(),
              weight: Number(weight) || 0,
              side: newSide,
              upside: upside === '' ? null : Number(upside),
              notes: notes.trim() || null,
            });
            if ('error' in result) {
              toast.error(result.error);
              return;
            }
            toast.success('Position updated.');
            router.refresh();
          });
        }}
        disabled={pending}
        style={{ color: tokens.ink, outline: 'none' }}
      >
        {SIDES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <input
        className="col-span-1 font-mono text-[13px] bg-transparent text-right"
        type="number"
        step="1"
        value={upside}
        onChange={(e) => setUpside(e.target.value)}
        onBlur={save}
        disabled={pending}
        style={{ color: tokens.ink, outline: 'none' }}
        placeholder="—"
      />
      <input
        className="col-span-3 font-sans text-[12px] bg-transparent"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={save}
        disabled={pending}
        style={{ color: tokens.ash, outline: 'none' }}
      />
      <div className="col-span-1 text-right">
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className="btn-quiet"
          aria-label="Delete position"
          style={{ color: tokens.whisper }}
        >
          <Trash2 size={12} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}

function NewPositionRow({ thesisId, nextOrder }: { thesisId: string; nextOrder: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [ticker, setTicker] = useState('');
  const [name, setName] = useState('');
  const [weight, setWeight] = useState('');
  const [side, setSide] = useState<PositionSide>('long');

  function save() {
    if (!ticker.trim() || !name.trim()) {
      toast.error('Ticker and name are required.');
      return;
    }
    startTransition(async () => {
      const result = await createPosition({
        thesis_id: thesisId,
        ticker: ticker.trim(),
        name: name.trim(),
        weight: Number(weight) || 0,
        side,
        position_order: nextOrder,
      });
      if ('error' in result) {
        toast.error(result.error);
        return;
      }
      toast.success('Position added.');
      setTicker('');
      setName('');
      setWeight('');
      setSide('long');
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <div className="py-4">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="font-sans text-[10px] tracking-[0.22em] uppercase btn-quiet inline-flex items-center gap-2"
          style={{ color: tokens.ink }}
        >
          <Plus size={12} strokeWidth={1.5} /> Add position
        </button>
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-12 gap-3 items-center py-3"
      style={{ borderBottom: `1px solid ${tokens.surface}` }}
    >
      <input
        autoFocus
        className="col-span-2 font-mono text-[13px] bg-transparent"
        value={ticker}
        onChange={(e) => setTicker(e.target.value)}
        placeholder="TICKER"
        disabled={pending}
        style={{ color: tokens.ink, outline: 'none' }}
      />
      <input
        className="col-span-3 font-sans text-[13px] bg-transparent"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
        disabled={pending}
        style={{ color: tokens.ash, outline: 'none' }}
      />
      <input
        className="col-span-1 font-mono text-[13px] bg-transparent text-right"
        type="number"
        step="0.1"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        placeholder="0"
        disabled={pending}
        style={{ color: tokens.ink, outline: 'none' }}
      />
      <select
        className="col-span-1 font-sans text-[11px] tracking-[0.06em] uppercase bg-transparent text-right"
        value={side}
        onChange={(e) => setSide(e.target.value as PositionSide)}
        disabled={pending}
        style={{ color: tokens.ink, outline: 'none' }}
      >
        {SIDES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <div className="col-span-5 flex items-center gap-4">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="font-sans text-[10px] tracking-[0.22em] uppercase btn-quiet"
          style={{ color: tokens.ink }}
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={pending}
          className="font-sans text-[10px] tracking-[0.22em] uppercase btn-quiet"
          style={{ color: tokens.whisper }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
