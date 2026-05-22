'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { CycleName, CycleStatus } from '@/lib/types';

type ActionResult = { ok: true } | { error: string };

const VALID_CYCLES: readonly CycleName[] = ['credit', 'market', 'juglar'];
const VALID_STATUSES: readonly CycleStatus[] = ['healthy', 'caution', 'alert'];

export type CycleOverrideInput = {
  cycle_name: CycleName;
  reading_override: string;
  override_status: CycleStatus | null;
  detail_override: string | null;
};

export async function setCycleOverride(
  input: CycleOverrideInput,
): Promise<ActionResult> {
  if (!VALID_CYCLES.includes(input.cycle_name)) {
    return { error: 'Invalid cycle name.' };
  }
  if (input.override_status !== null && !VALID_STATUSES.includes(input.override_status)) {
    return { error: 'Invalid status override.' };
  }
  const reading = input.reading_override.trim();
  if (!reading) return { error: 'Reading text is required.' };
  if (reading.length > 120) return { error: 'Reading text must be 120 characters or fewer.' };
  const detail = input.detail_override?.trim() ?? null;
  if (detail && detail.length > 400) {
    return { error: 'Detail must be 400 characters or fewer.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('cycle_overrides').upsert(
    {
      cycle_name: input.cycle_name,
      reading_override: reading,
      override_status: input.override_status,
      detail_override: detail,
      set_at: new Date().toISOString(),
      expires_at: null,
    },
    { onConflict: 'cycle_name' },
  );
  if (error) return { error: error.message };
  revalidatePath('/cycles');
  return { ok: true };
}

export async function clearCycleOverride(
  cycleName: CycleName,
): Promise<ActionResult> {
  if (!VALID_CYCLES.includes(cycleName)) {
    return { error: 'Invalid cycle name.' };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from('cycle_overrides')
    .delete()
    .eq('cycle_name', cycleName);
  if (error) return { error: error.message };
  revalidatePath('/cycles');
  return { ok: true };
}
