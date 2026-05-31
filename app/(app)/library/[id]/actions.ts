'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { TriggerType, TriggerStatus } from '@/lib/types';

type ActionResult = { ok: true } | { error: string };

export type TriggerInput = {
  thesis_id: string;
  type: TriggerType;
  description: string;
  monitoring_signal: string | null;
  threshold: string | null;
  status: TriggerStatus;
};

const VALID_TYPES: TriggerType[] = ['confirming', 'disconfirming', 'kill-on-sight'];
const VALID_STATUSES: TriggerStatus[] = ['armed', 'fired', 'disarmed'];

function validateTrigger(input: TriggerInput): string | null {
  if (!input.thesis_id.trim()) return 'Thesis id is required.';
  if (!input.description.trim()) return 'Description is required.';
  if (!VALID_TYPES.includes(input.type)) return 'Invalid trigger type.';
  if (!VALID_STATUSES.includes(input.status)) return 'Invalid trigger status.';
  return null;
}

// Trim free-text fields and collapse empty strings to null at the DB boundary,
// so the column never holds the empty-string sentinel.
function normalize(input: TriggerInput) {
  return {
    thesis_id: input.thesis_id,
    type: input.type,
    description: input.description.trim(),
    monitoring_signal: input.monitoring_signal?.trim() || null,
    threshold: input.threshold?.trim() || null,
    status: input.status,
  };
}

export async function createTrigger(input: TriggerInput): Promise<ActionResult> {
  const validationError = validateTrigger(input);
  if (validationError) return { error: validationError };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not signed in.' };

  const { error } = await supabase.from('triggers').insert(normalize(input));
  if (error) return { error: error.message };

  revalidatePath(`/library/${input.thesis_id}`);
  revalidatePath('/watch');
  return { ok: true };
}

export async function updateTrigger(id: string, input: TriggerInput): Promise<ActionResult> {
  const validationError = validateTrigger(input);
  if (validationError) return { error: validationError };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not signed in.' };

  const { error } = await supabase.from('triggers').update(normalize(input)).eq('id', id);
  if (error) return { error: error.message };

  revalidatePath(`/library/${input.thesis_id}`);
  revalidatePath('/watch');
  return { ok: true };
}

// `thesisId` is taken explicitly (not looked up via the row's thesis_id)
// because the row is gone by the time we revalidate.
export async function deleteTrigger(id: string, thesisId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not signed in.' };

  const { error } = await supabase.from('triggers').delete().eq('id', id);
  if (error) return { error: error.message };

  revalidatePath(`/library/${thesisId}`);
  revalidatePath('/watch');
  return { ok: true };
}
