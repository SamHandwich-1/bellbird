'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { CycleStage, ThesisStatus, PositionSide } from '@/lib/types';

type ActionResult<T = void> = T extends void
  ? { ok: true } | { error: string }
  : { ok: true; data: T } | { error: string };

type ThesisPayload = {
  name: string;
  sector: string | null;
  conviction: number;
  timing: string | null;
  status: ThesisStatus;
  cycle_stage: CycleStage | null;
  summary: string | null;
  hedge_note: string | null;
  in_portfolio: boolean;
};

export async function createThesis(
  input: ThesisPayload & { id: string },
): Promise<ActionResult> {
  if (!input.name.trim()) return { error: 'Name is required.' };
  const supabase = await createClient();
  const { error } = await supabase.from('theses').insert(input);
  if (error) return { error: error.message };
  revalidatePath('/library');
  return { ok: true };
}

export async function updateThesis(
  id: string,
  input: ThesisPayload,
): Promise<ActionResult> {
  if (!input.name.trim()) return { error: 'Name is required.' };
  const supabase = await createClient();
  const { error } = await supabase.from('theses').update(input).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/library');
  revalidatePath(`/library/${id}`);
  return { ok: true };
}

export async function deleteThesis(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from('theses').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/library');
  return { ok: true };
}

export async function togglePortfolio(
  id: string,
  inPortfolio: boolean,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('theses')
    .update({ in_portfolio: inPortfolio })
    .eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/library');
  revalidatePath(`/library/${id}`);
  return { ok: true };
}

type PositionPayload = {
  thesis_id: string;
  ticker: string;
  name: string;
  weight: number;
  side: PositionSide;
  valuation?: string | null;
  upside?: number | null;
  notes?: string | null;
  position_order?: number | null;
};

export async function createPosition(input: PositionPayload): Promise<ActionResult> {
  if (!input.ticker.trim() || !input.name.trim()) {
    return { error: 'Ticker and name are required.' };
  }
  const supabase = await createClient();
  const { error } = await supabase.from('positions').insert(input);
  if (error) return { error: error.message };
  revalidatePath(`/library/${input.thesis_id}`);
  return { ok: true };
}

type PositionUpdate = {
  ticker: string;
  name: string;
  weight: number;
  side: PositionSide;
  valuation?: string | null;
  upside?: number | null;
  notes?: string | null;
};

export async function updatePosition(
  id: string,
  input: PositionUpdate,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('positions')
    .update(input)
    .eq('id', id)
    .select('thesis_id')
    .single();
  if (error) return { error: error.message };
  if (data?.thesis_id) revalidatePath(`/library/${data.thesis_id}`);
  return { ok: true };
}

export async function deletePosition(
  id: string,
  thesisId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from('positions').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath(`/library/${thesisId}`);
  return { ok: true };
}
