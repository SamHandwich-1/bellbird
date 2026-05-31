import { createClient } from '@/lib/supabase/server';
import type { Trigger } from '@/lib/types';

// Per-thesis trigger list, ordered by creation time. Used by Library detail.
export async function getTriggersForThesis(thesisId: string): Promise<Trigger[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('triggers')
    .select('*')
    .eq('thesis_id', thesisId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Trigger[];
}

// All triggers across all theses. Used by Watch — grouped in page code rather
// than via a per-thesis query loop. Small dataset, single round trip wins.
export async function getAllTriggers(): Promise<Trigger[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('triggers')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Trigger[];
}
