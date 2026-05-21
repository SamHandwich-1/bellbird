import { createClient } from '@/lib/supabase/server';
import type { Trade, CurrentPrice, Thesis } from '@/lib/types';

export async function getTrades(): Promise<Trade[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .order('executed_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Trade[];
}

export async function getCurrentPrices(): Promise<CurrentPrice[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('current_prices')
    .select('*');
  if (error) throw error;
  return (data ?? []) as CurrentPrice[];
}

// Lightweight {id, name} list for the trade-entry form's thesis select.
// Excludes discarded conversations' linked theses indirectly — only theses
// rows themselves matter here. Status filter not applied; the user can link
// trades to any thesis they have.
export async function getThesesForPortfolio(): Promise<Pick<Thesis, 'id' | 'name'>[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('theses')
    .select('id, name')
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Pick<Thesis, 'id' | 'name'>[];
}
