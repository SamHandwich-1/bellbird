'use client';

// v2 trigger entry modal. Same pattern as TradeEntryModal:
// backdrop-click + Escape close, useTransition, sonner.
// Create + edit share this component — `initial` distinguishes.

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { tokens } from '@/lib/tokens';
import type { Trigger, TriggerType, TriggerStatus } from '@/lib/types';
import {
  createTrigger,
  updateTrigger,
  type TriggerInput,
} from '@/app/(app)/library/[id]/actions';

export function TriggerEntryModal({
  onClose,
  thesisId,
  initial,
}: {
  onClose: () => void;
  thesisId: string;
  initial?: Trigger;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [type, setType] = useState<TriggerType>(initial?.type ?? 'confirming');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [monitoringSignal, setMonitoringSignal] = useState(
    initial?.monitoring_signal ?? '',
  );
  const [threshold, setThreshold] = useState(initial?.threshold ?? '');
  const [status, setStatus] = useState<TriggerStatus>(initial?.status ?? 'armed');

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
      const payload: TriggerInput = {
        thesis_id: thesisId,
        type,
        description: description.trim(),
        monitoring_signal: monitoringSignal.trim() || null,
        threshold: threshold.trim() || null,
        status,
      };
      const result = initial
        ? await updateTrigger(initial.id, payload)
        : await createTrigger(payload);
      if ('error' in result) {
        toast.error(result.error);
        return;
      }
      toast.success(initial ? 'Trigger updated.' : 'Trigger saved.');
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
            {initial ? 'Edit trigger' : 'New trigger'}
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
          <Field label="Type">
            <Select
              value={type}
              onChange={(e) => setType(e.target.value as TriggerType)}
              disabled={pending}
            >
              <option value="confirming">Confirming</option>
              <option value="disconfirming">Disconfirming</option>
              <option value="kill-on-sight">Kill-on-sight</option>
            </Select>
          </Field>

          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              required
              disabled={pending}
              autoFocus={!initial}
              className="serif"
              placeholder="e.g. Hyperscaler capex deceleration"
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

          <Grid cols={2}>
            <Field label="Monitoring signal (optional)">
              <Input
                value={monitoringSignal}
                onChange={(e) => setMonitoringSignal(e.target.value)}
                placeholder="e.g. NVDA capex YoY"
                disabled={pending}
                mono
              />
            </Field>
            <Field label="Threshold (optional)">
              <Input
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                placeholder="e.g. < +15%"
                disabled={pending}
                mono
              />
            </Field>
          </Grid>

          <Field label="Status">
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as TriggerStatus)}
              disabled={pending}
            >
              <option value="armed">Armed</option>
              <option value="fired">Fired</option>
              <option value="disarmed">Disarmed</option>
            </Select>
          </Field>

          <div style={{ display: 'flex', alignItems: 'center', gap: 24, paddingTop: 8 }}>
            <button
              type="submit"
              disabled={pending}
              className="label btn-quiet"
              style={{
                color: tokens.chime,
                paddingBottom: 4,
                background: 'transparent',
                border: 'none',
                borderBottomWidth: 1,
                borderBottomStyle: 'solid',
                borderBottomColor: tokens.chime,
                cursor: pending ? 'wait' : 'pointer',
                opacity: pending ? 0.5 : 1,
              }}
            >
              {pending ? 'Saving' : initial ? 'Save changes' : 'Save trigger'}
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block' }}>
      <div className="label" style={{ color: tokens.muted, marginBottom: 8 }}>
        {label}
      </div>
      {children}
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { mono?: boolean }) {
  const { mono, style, ...rest } = props;
  return (
    <input
      {...rest}
      className={mono ? 'mono' : 'serif'}
      style={{
        fontSize: 15,
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
