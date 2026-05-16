'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { seedTheses } from '@/lib/seed/theses';

export type SeedResult =
  | { ok: true; theses: number; positions: number }
  | { error: string };

export async function seedLibrary(): Promise<SeedResult> {
  const auth = await createClient();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user) return { error: 'You must be signed in to seed the library.' };

  const admin = createAdminClient();

  const { count, error: countError } = await admin
    .from('theses')
    .select('id', { count: 'exact', head: true });
  if (countError) return { error: countError.message };
  if ((count ?? 0) > 0) {
    return { error: `Library already has ${count} theses. Seed aborted.` };
  }

  const thesesRows = seedTheses.map((t) => ({
    id: t.id,
    name: t.name,
    sector: t.sector,
    conviction: t.conviction,
    timing: t.timing,
    status: t.status,
    cycle_stage: t.cycle_stage,
    summary: t.summary,
    hedge_note: t.hedge_note,
    in_portfolio: false,
    created_at: t.created_at ?? new Date().toISOString(),
    updated_at: t.created_at ?? new Date().toISOString(),
  }));

  const { error: thesesError } = await admin.from('theses').insert(thesesRows);
  if (thesesError) return { error: `Theses insert failed: ${thesesError.message}` };

  const positionRows = seedTheses.flatMap((t) =>
    t.positions.map((p, idx) => ({
      thesis_id: t.id,
      ticker: p.ticker,
      name: p.name,
      weight: p.weight,
      side: p.side,
      valuation: p.valuation,
      upside: p.upside,
      notes: p.notes,
      position_order: idx,
    })),
  );

  const { error: positionsError } = await admin.from('positions').insert(positionRows);
  if (positionsError) {
    return { error: `Positions insert failed: ${positionsError.message}` };
  }

  revalidatePath('/library');
  return { ok: true, theses: thesesRows.length, positions: positionRows.length };
}
