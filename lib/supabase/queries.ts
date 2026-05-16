import { createClient } from '@/lib/supabase/server';
import type { Thesis, Position, CycleStage } from '@/lib/types';

export type LibraryFilters = {
  view?: 'all' | 'portfolio' | 'watchlist';
  stage?: CycleStage | 'all';
};

export async function getTheses(filters: LibraryFilters = {}): Promise<Thesis[]> {
  const supabase = await createClient();
  let query = supabase.from('theses').select('*').order('updated_at', { ascending: false });

  if (filters.view === 'portfolio') query = query.eq('in_portfolio', true);
  if (filters.view === 'watchlist') query = query.eq('in_portfolio', false);
  if (filters.stage && filters.stage !== 'all') query = query.eq('cycle_stage', filters.stage);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Thesis[];
}

export async function getThesisById(id: string): Promise<Thesis | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('theses').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return (data as Thesis | null) ?? null;
}

export async function getThesesCount(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from('theses')
    .select('id', { count: 'exact', head: true });
  if (error) throw error;
  return count ?? 0;
}

export async function getPositionsForThesis(thesisId: string): Promise<Position[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('positions')
    .select('*')
    .eq('thesis_id', thesisId)
    .order('position_order', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as Position[];
}
