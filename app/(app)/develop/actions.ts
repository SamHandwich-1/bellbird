'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { buildMacroFactPack } from '@/lib/ai/fact-pack';
import type { StructuredThesis } from '@/lib/ai/schemas';

type ActionResult<T = void> = T extends void
  ? { ok: true } | { error: string }
  : { ok: true; data: T } | { error: string };

export async function createConversation(): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not signed in.' };

  const { data, error } = await supabase
    .from('conversations')
    .insert({ status: 'open' })
    .select('id')
    .single();
  if (error) return { error: error.message };

  // Pre-flight fact pack — assemble and persist the LIVE macro snapshot at
  // conversation start. Non-fatal: a failure leaves fact_pack null and the
  // chat route backfills it once on the first turn.
  try {
    const pack = await buildMacroFactPack(supabase);
    await supabase.from('conversations').update({ fact_pack: pack }).eq('id', data.id);
  } catch (e) {
    console.error('[createConversation] fact pack build failed', e);
  }

  revalidatePath('/develop');
  return { id: data.id };
}

export async function discardConversation(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('conversations')
    .update({ status: 'discarded', updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/develop');
  revalidatePath(`/develop/${id}`);
  return { ok: true };
}

export async function renameConversation(
  id: string,
  rawTitle: string | null,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not signed in.' };

  // Trim; empty string -> null. Storing null surfaces "Untitled conversation".
  const trimmed = rawTitle == null ? null : rawTitle.trim();
  const title = trimmed === '' ? null : trimmed;

  const { error } = await supabase
    .from('conversations')
    .update({ title, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/develop');
  revalidatePath(`/develop/${id}`);
  return { ok: true };
}

export async function deleteConversation(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not signed in.' };

  // Hard delete. FK ON DELETE CASCADE on messages / stress_tests / opus_verdicts
  // takes care of dependent rows. No soft-delete by design (per plan).
  const { error } = await supabase.from('conversations').delete().eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/develop');
  return { ok: true };
}

export async function resetToPhase1(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  // Soft-supersede prior pipeline outputs so the UI sees a clean slate while
  // the rows stay in the DB for audit. Match only currently-active rows.
  const { error: msgErr } = await supabase
    .from('messages')
    .update({ superseded_at: now })
    .eq('conversation_id', id)
    .gte('phase', 2)
    .is('superseded_at', null);
  if (msgErr) return { error: msgErr.message };

  const { error: stErr } = await supabase
    .from('stress_tests')
    .update({ superseded_at: now })
    .eq('conversation_id', id)
    .is('superseded_at', null);
  if (stErr) return { error: stErr.message };

  const { error: vErr } = await supabase
    .from('opus_verdicts')
    .update({ superseded_at: now })
    .eq('conversation_id', id)
    .is('superseded_at', null);
  if (vErr) return { error: vErr.message };

  // Bump iteration. The chat route reads conversations.iteration to stamp
  // new messages — bumping here means the next user reply (and Opus turn)
  // land in iteration N+1, which the UI walks to insert IterationDivider.
  const { data: convRow, error: readErr } = await supabase
    .from('conversations')
    .select('iteration')
    .eq('id', id)
    .maybeSingle();
  if (readErr) return { error: readErr.message };
  const nextIteration = (convRow?.iteration ?? 0) + 1;

  const { error } = await supabase
    .from('conversations')
    .update({ status: 'open', iteration: nextIteration, updated_at: now })
    .eq('id', id);
  if (error) return { error: error.message };

  revalidatePath(`/develop/${id}`);
  return { ok: true };
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'thesis'
  );
}

export async function commitToLibrary(
  conversationId: string,
): Promise<{ ok: true; thesisId: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not signed in.' };

  // Pull most recent Phase 2 row (the structured draft)
  const { data: phase2Row, error: phase2Err } = await supabase
    .from('messages')
    .select('metadata')
    .eq('conversation_id', conversationId)
    .eq('phase', 2)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (phase2Err) return { error: phase2Err.message };
  if (!phase2Row) return { error: 'No structured draft on this conversation.' };

  const meta = (phase2Row.metadata ?? {}) as { structured?: StructuredThesis };
  const draft = meta.structured;
  if (!draft) return { error: 'Structured draft missing from Phase 2 row.' };

  // Verify most recent verdict is PROCEED
  const { data: lastVerdict, error: verdictErr } = await supabase
    .from('opus_verdicts')
    .select('verdict')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (verdictErr) return { error: verdictErr.message };
  if (!lastVerdict || lastVerdict.verdict !== 'PROCEED') {
    return { error: 'Most recent verdict is not PROCEED.' };
  }

  const admin = createAdminClient();
  const year = new Date().getFullYear();
  const baseId = `${slugify(draft.name)}-${year}`;

  // Ensure unique id — append -N if needed
  let thesisId = baseId;
  for (let n = 2; n < 100; n++) {
    const { data: exists } = await admin
      .from('theses')
      .select('id')
      .eq('id', thesisId)
      .maybeSingle();
    if (!exists) break;
    thesisId = `${baseId}-${n}`;
  }

  const { error: insErr } = await admin.from('theses').insert({
    id: thesisId,
    name: draft.name,
    sector: draft.sector,
    conviction: draft.conviction,
    timing: draft.timing,
    status: 'active',
    cycle_stage: draft.cycle_stage,
    summary: draft.summary,
    hedge_note: draft.hedge_note || null,
    in_portfolio: false,
  });
  if (insErr) return { error: `Thesis insert failed: ${insErr.message}` };

  const positionRows = draft.positions.map((p, idx) => ({
    thesis_id: thesisId,
    ticker: p.ticker,
    name: p.name,
    weight: p.weight,
    side: p.side,
    valuation: p.valuation,
    upside: p.upside,
    notes: p.notes,
    position_order: idx,
  }));
  const { error: posErr } = await admin.from('positions').insert(positionRows);
  if (posErr) return { error: `Positions insert failed: ${posErr.message}` };

  await admin
    .from('conversations')
    .update({
      status: 'completed',
      thesis_id: thesisId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId);

  revalidatePath('/develop');
  revalidatePath('/library');
  revalidatePath(`/library/${thesisId}`);
  return { ok: true, thesisId };
}

export async function startNewConversationAndRedirect(): Promise<never> {
  const result = await createConversation();
  if ('error' in result) {
    throw new Error(result.error);
  }
  redirect(`/develop/${result.id}`);
}
