'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { tokens } from '@/lib/tokens';
import type { CycleName, CycleStatus, MergedCycleReading } from '@/lib/types';
import { setCycleOverride, clearCycleOverride } from '@/app/(app)/cycles/actions';

type Props = {
  reading: MergedCycleReading;
  label: string;
};

const STATUS_OPTIONS: ReadonlyArray<{ value: CycleStatus | ''; label: string }> = [
  { value: '', label: 'use rules baseline' },
  { value: 'healthy', label: 'healthy' },
  { value: 'caution', label: 'caution' },
  { value: 'alert', label: 'alert' },
];

export function CycleOverrideForm({ reading, label }: Props) {
  const [open, setOpen] = useState(false);
  const [overrideText, setOverrideText] = useState(reading.is_manual ? reading.reading : '');
  const [detail, setDetail] = useState(reading.is_manual ? (reading.detail ?? '') : '');
  const [statusValue, setStatusValue] = useState<CycleStatus | ''>(
    reading.is_manual && reading.rules_status !== reading.status ? reading.status : '',
  );
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-sans text-[10px] tracking-[0.22em] uppercase btn-quiet"
        style={{ color: tokens.chime }}
      >
        {reading.is_manual ? 'Edit override' : 'Set manual override'}
      </button>
    );
  }

  const cycleName: CycleName = reading.cycle_name;

  const handleSave = () => {
    const trimmed = overrideText.trim();
    if (!trimmed) {
      toast.error('Override reading text cannot be empty.');
      return;
    }
    startTransition(async () => {
      const result = await setCycleOverride({
        cycle_name: cycleName,
        reading_override: trimmed,
        override_status: statusValue === '' ? null : statusValue,
        detail_override: detail.trim() === '' ? null : detail.trim(),
      });
      if ('error' in result) {
        toast.error(result.error);
        return;
      }
      toast.success(`Override saved for ${label.toLowerCase()}.`);
      setOpen(false);
    });
  };

  const handleClear = () => {
    startTransition(async () => {
      const result = await clearCycleOverride(cycleName);
      if ('error' in result) {
        toast.error(result.error);
        return;
      }
      toast.success(`Override cleared for ${label.toLowerCase()}.`);
      setOverrideText('');
      setDetail('');
      setStatusValue('');
      setOpen(false);
    });
  };

  return (
    <div
      className="mt-4 p-4"
      style={{ background: tokens.surface, border: `1px solid ${tokens.hairline}` }}
    >
      <div
        className="font-sans text-[10px] tracking-[0.22em] uppercase mb-3"
        style={{ color: tokens.whisper }}
      >
        Manual override
      </div>
      <label className="block mb-3">
        <div
          className="font-sans text-[10px] tracking-[0.16em] uppercase mb-1"
          style={{ color: tokens.ash }}
        >
          Reading
        </div>
        <input
          type="text"
          value={overrideText}
          onChange={(e) => setOverrideText(e.target.value)}
          placeholder='e.g. "Turning — private credit gates"'
          maxLength={120}
          className="w-full px-2 py-1 font-serif text-[15px]"
          style={{
            background: tokens.paper,
            border: `1px solid ${tokens.hairline}`,
            color: tokens.ink,
            fontWeight: 360,
          }}
        />
      </label>
      <label className="block mb-3">
        <div
          className="font-sans text-[10px] tracking-[0.16em] uppercase mb-1"
          style={{ color: tokens.ash }}
        >
          Detail (optional)
        </div>
        <textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder="Why you're overriding the rules…"
          maxLength={400}
          rows={2}
          className="w-full px-2 py-1 font-sans text-[12px]"
          style={{
            background: tokens.paper,
            border: `1px solid ${tokens.hairline}`,
            color: tokens.ink,
            resize: 'vertical',
          }}
        />
      </label>
      <label className="block mb-4">
        <div
          className="font-sans text-[10px] tracking-[0.16em] uppercase mb-1"
          style={{ color: tokens.ash }}
        >
          Status override
        </div>
        <select
          value={statusValue}
          onChange={(e) => setStatusValue(e.target.value as CycleStatus | '')}
          className="font-sans text-[12px] px-2 py-1"
          style={{
            background: tokens.paper,
            border: `1px solid ${tokens.hairline}`,
            color: tokens.ink,
          }}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <div className="flex items-center gap-4 flex-wrap">
        <button
          type="button"
          onClick={handleSave}
          disabled={pending}
          className="font-sans text-[10px] tracking-[0.22em] uppercase btn-quiet"
          style={{ color: tokens.chime, opacity: pending ? 0.5 : 1 }}
        >
          {pending ? 'Saving…' : 'Save override'}
        </button>
        {reading.is_manual && (
          <button
            type="button"
            onClick={handleClear}
            disabled={pending}
            className="font-sans text-[10px] tracking-[0.22em] uppercase btn-quiet"
            style={{ color: tokens.terracotta, opacity: pending ? 0.5 : 1 }}
          >
            Clear override
          </button>
        )}
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={pending}
          className="font-sans text-[10px] tracking-[0.22em] uppercase btn-quiet"
          style={{ color: tokens.ash }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
