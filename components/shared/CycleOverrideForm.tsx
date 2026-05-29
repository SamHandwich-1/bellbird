'use client';

// v2 cycle override editor — inline-card pattern beneath a CycleGaugeBare.
// Writes through the same server-action surface as the v1 form
// (setCycleOverride / clearCycleOverride). UI rebuilt in v2 dark-paper
// palette, useTransition + sonner like Turn B's TradeEntryModal.

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { tokens } from '@/lib/tokens';
import type { CycleName, CycleStatus, MergedCycleReading } from '@/lib/types';
import { setCycleOverride, clearCycleOverride } from '@/app/(app)/cycles/actions';

const STATUS_OPTIONS: ReadonlyArray<{ value: CycleStatus | ''; label: string }> = [
  { value: '', label: 'Use rules baseline' },
  { value: 'healthy', label: 'Healthy' },
  { value: 'caution', label: 'Caution' },
  { value: 'alert', label: 'Alert' },
];

type Props = {
  reading: MergedCycleReading;
  label: string;
};

export function CycleOverrideForm({ reading, label }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [readingText, setReadingText] = useState(reading.is_manual ? reading.reading : '');
  const [detail, setDetail] = useState(reading.is_manual ? (reading.detail ?? '') : '');
  const [statusValue, setStatusValue] = useState<CycleStatus | ''>(
    reading.is_manual && reading.rules_status !== reading.status ? reading.status : '',
  );

  const cycleName: CycleName = reading.cycle_name;

  if (!open) {
    return (
      <div style={{ marginTop: 14 }}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="label btn-quiet"
          style={{
            color: tokens.chime,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          {reading.is_manual ? 'Edit override' : 'Set override'}
        </button>
      </div>
    );
  }

  const handleSave = () => {
    const trimmed = readingText.trim();
    if (!trimmed) {
      toast.error('Reading text cannot be empty.');
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
      router.refresh();
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
      setReadingText('');
      setDetail('');
      setStatusValue('');
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <div
      style={{
        marginTop: 18,
        padding: '20px 22px',
        background: tokens.panel,
        border: `1px solid ${tokens.line}`,
      }}
    >
      <div className="label" style={{ color: tokens.muted, marginBottom: 18 }}>
        Manual override
      </div>

      <Field label="Reading">
        <Input
          value={readingText}
          onChange={(e) => setReadingText(e.target.value)}
          placeholder='e.g. "Late expansion"'
          maxLength={120}
          disabled={pending}
        />
      </Field>

      <Field label="Detail (optional)">
        <textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder="Why you're overriding the rules baseline…"
          maxLength={400}
          rows={3}
          disabled={pending}
          className="serif"
          style={{
            fontSize: 14,
            lineHeight: 1.5,
            width: '100%',
            background: 'transparent',
            paddingBottom: 6,
            resize: 'none',
            color: tokens.text,
            outline: 'none',
            border: 'none',
            borderBottom: `1px solid ${tokens.line}`,
          }}
        />
      </Field>

      <Field label="Status">
        <Select
          value={statusValue}
          onChange={(e) => setStatusValue(e.target.value as CycleStatus | '')}
          disabled={pending}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </Field>

      <div style={{ display: 'flex', alignItems: 'center', gap: 22, paddingTop: 8 }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={pending}
          className="label btn-quiet"
          style={{
            color: tokens.chime,
            background: 'transparent',
            border: 'none',
            borderBottom: `1px solid ${tokens.chime}`,
            paddingBottom: 4,
            cursor: pending ? 'wait' : 'pointer',
            opacity: pending ? 0.5 : 1,
          }}
        >
          {pending ? 'Saving' : 'Save'}
        </button>
        {reading.is_manual && (
          <button
            type="button"
            onClick={handleClear}
            disabled={pending}
            className="label btn-quiet"
            style={{
              color: tokens.terracotta,
              background: 'transparent',
              border: 'none',
              cursor: pending ? 'wait' : 'pointer',
              opacity: pending ? 0.5 : 1,
            }}
          >
            Clear override
          </button>
        )}
        <button
          type="button"
          onClick={() => setOpen(false)}
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
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', marginBottom: 18 }}>
      <div className="label" style={{ color: tokens.muted, marginBottom: 8 }}>
        {label}
      </div>
      {children}
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { style, ...rest } = props;
  return (
    <input
      {...rest}
      className="serif"
      style={{
        fontSize: 15,
        width: '100%',
        background: 'transparent',
        paddingBottom: 6,
        color: tokens.text,
        outline: 'none',
        border: 'none',
        borderBottom: `1px solid ${tokens.line}`,
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
        outline: 'none',
        border: 'none',
        borderBottom: `1px solid ${tokens.line}`,
        ...style,
      }}
    >
      {children}
    </select>
  );
}
