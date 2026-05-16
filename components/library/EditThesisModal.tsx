'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { tokens } from '@/lib/tokens';
import type { Thesis, CycleStage, ThesisStatus } from '@/lib/types';
import { createThesis, updateThesis } from '@/app/(app)/library/actions';

const CYCLE_STAGES: CycleStage[] = [
  'secular',
  'long-cycle',
  'mid-cycle',
  'credit-cycle',
  'narrative-cycle',
];

const STATUSES: ThesisStatus[] = ['active', 'watching', 'closed'];

type Props = {
  onClose: () => void;
  initial?: Thesis;
};

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'thesis'
  );
}

export function EditThesisModal({ onClose, initial }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState(initial?.name ?? '');
  const [sector, setSector] = useState(initial?.sector ?? '');
  const [conviction, setConviction] = useState(initial?.conviction ?? 50);
  const [timing, setTiming] = useState(initial?.timing ?? '');
  const [status, setStatus] = useState<ThesisStatus>(initial?.status ?? 'active');
  const [cycleStage, setCycleStage] = useState<CycleStage | ''>(
    initial?.cycle_stage ?? '',
  );
  const [summary, setSummary] = useState(initial?.summary ?? '');
  const [hedgeNote, setHedgeNote] = useState(initial?.hedge_note ?? '');
  const [inPortfolio, setInPortfolio] = useState(initial?.in_portfolio ?? false);

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
      const payload = {
        name: name.trim(),
        sector: sector.trim() || null,
        conviction,
        timing: timing.trim() || null,
        status,
        cycle_stage: (cycleStage || null) as CycleStage | null,
        summary: summary.trim() || null,
        hedge_note: hedgeNote.trim() || null,
        in_portfolio: inPortfolio,
      };

      if (initial) {
        const result = await updateThesis(initial.id, payload);
        if ('error' in result) {
          toast.error(result.error);
          return;
        }
        toast.success('Thesis updated.');
        onClose();
        router.refresh();
      } else {
        const id = `${slugify(name)}-${new Date().getFullYear()}`;
        const result = await createThesis({ id, ...payload });
        if ('error' in result) {
          toast.error(result.error);
          return;
        }
        toast.success('Thesis created.');
        onClose();
        router.push(`/library/${id}`);
      }
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
        className="w-full max-w-2xl my-12 p-8"
        style={{ background: tokens.paper, border: `1px solid ${tokens.hairline}` }}
      >
        <div className="flex items-center justify-between mb-8">
          <div
            className="font-sans text-[10px] tracking-[0.22em] uppercase"
            style={{ color: tokens.whisper }}
          >
            {initial ? 'Edit thesis' : 'New thesis'}
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
          <Field label="Name">
            <input
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="font-serif text-[20px] w-full bg-transparent pb-2"
              style={{
                fontWeight: 360,
                color: tokens.ink,
                borderBottom: `1px solid ${tokens.hairline}`,
                outline: 'none',
              }}
              disabled={pending}
            />
          </Field>

          <Field label="Sector">
            <input
              type="text"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              placeholder="e.g. Industrials × Utilities"
              className="font-sans text-[14px] w-full bg-transparent pb-2"
              style={{
                color: tokens.ink,
                borderBottom: `1px solid ${tokens.hairline}`,
                outline: 'none',
              }}
              disabled={pending}
            />
          </Field>

          <div className="grid grid-cols-2 gap-6">
            <Field label={`Conviction · ${conviction}%`}>
              <input
                type="range"
                min={0}
                max={100}
                value={conviction}
                onChange={(e) => setConviction(Number(e.target.value))}
                className="w-full"
                disabled={pending}
              />
            </Field>
            <Field label="Timing">
              <input
                type="text"
                value={timing}
                onChange={(e) => setTiming(e.target.value)}
                placeholder="e.g. 18-24 months"
                className="font-sans text-[14px] w-full bg-transparent pb-2"
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
            <Field label="Status">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ThesisStatus)}
                className="font-sans text-[13px] tracking-[0.1em] uppercase w-full bg-transparent pb-2"
                style={{
                  color: tokens.ink,
                  borderBottom: `1px solid ${tokens.hairline}`,
                  outline: 'none',
                }}
                disabled={pending}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Cycle stage">
              <select
                value={cycleStage}
                onChange={(e) => setCycleStage(e.target.value as CycleStage | '')}
                className="font-sans text-[13px] tracking-[0.1em] uppercase w-full bg-transparent pb-2"
                style={{
                  color: tokens.ink,
                  borderBottom: `1px solid ${tokens.hairline}`,
                  outline: 'none',
                }}
                disabled={pending}
              >
                <option value="">—</option>
                {CYCLE_STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Summary">
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={4}
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

          <Field label="Hedge note">
            <textarea
              value={hedgeNote}
              onChange={(e) => setHedgeNote(e.target.value)}
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

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={inPortfolio}
              onChange={(e) => setInPortfolio(e.target.checked)}
              disabled={pending}
            />
            <span
              className="font-sans text-[11px] tracking-[0.16em] uppercase"
              style={{ color: tokens.ink }}
            >
              In portfolio
            </span>
          </label>

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
              {pending ? 'Saving' : initial ? 'Save changes' : 'Create thesis'}
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
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
