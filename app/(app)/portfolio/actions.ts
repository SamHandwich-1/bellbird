'use server';

import { revalidatePath } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import type { TradeSide } from '@/lib/types';

type ActionResult = { ok: true } | { error: string };

export type TradeInput = {
  thesis_id: string | null;
  ticker: string;
  side: TradeSide;
  quantity: number;
  price: number;
  fees: number;
  executed_at: string;          // ISO timestamp
  notes: string | null;
};

function validateTrade(input: TradeInput): string | null {
  if (!input.ticker.trim()) return 'Ticker is required.';
  if (!Number.isFinite(input.quantity) || input.quantity <= 0) {
    return 'Quantity must be a positive number.';
  }
  if (!Number.isFinite(input.price) || input.price < 0) {
    return 'Price must be a non-negative number.';
  }
  if (!Number.isFinite(input.fees) || input.fees < 0) {
    return 'Fees must be a non-negative number.';
  }
  if (!input.executed_at) return 'Trade date is required.';
  if (input.side !== 'buy' && input.side !== 'sell') return 'Side must be buy or sell.';
  return null;
}

// Over-sell guardrail. Sums current net qty for the ticker (today's view, not
// as-of executed_at) and rejects if the proposed sell exceeds it. When editing
// an existing trade, that trade's contribution is excluded from the sum so the
// available number reflects what would be available without this row.
async function assertSellableQuantity(
  supabase: SupabaseClient,
  ticker: string,
  qty: number,
  excludeId?: string,
): Promise<string | null> {
  let query = supabase
    .from('trades')
    .select('side, quantity')
    .eq('ticker', ticker.trim());
  if (excludeId) query = query.neq('id', excludeId);
  const { data, error } = await query;
  if (error) return error.message;

  const net = (data ?? []).reduce(
    (acc, t) =>
      acc + (t.side === 'buy' ? Number(t.quantity) : -Number(t.quantity)),
    0,
  );

  if (qty > net) {
    return `Cannot sell ${qty} of ${ticker.trim()} — only ${net} currently held.`;
  }
  return null;
}

export async function createTrade(input: TradeInput): Promise<ActionResult> {
  const validationError = validateTrade(input);
  if (validationError) return { error: validationError };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not signed in.' };

  if (input.side === 'sell') {
    const guardError = await assertSellableQuantity(
      supabase,
      input.ticker,
      input.quantity,
    );
    if (guardError) return { error: guardError };
  }

  const { error } = await supabase.from('trades').insert({
    thesis_id: input.thesis_id,
    ticker: input.ticker.trim(),
    side: input.side,
    quantity: input.quantity,
    price: input.price,
    currency: 'AUD',
    fees: input.fees,
    executed_at: input.executed_at,
    notes: input.notes?.trim() || null,
  });
  if (error) return { error: error.message };

  revalidatePath('/portfolio');
  return { ok: true };
}

export async function updateTrade(
  id: string,
  input: TradeInput,
): Promise<ActionResult> {
  const validationError = validateTrade(input);
  if (validationError) return { error: validationError };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not signed in.' };

  if (input.side === 'sell') {
    const guardError = await assertSellableQuantity(
      supabase,
      input.ticker,
      input.quantity,
      id,
    );
    if (guardError) return { error: guardError };
  }

  const { error } = await supabase
    .from('trades')
    .update({
      thesis_id: input.thesis_id,
      ticker: input.ticker.trim(),
      side: input.side,
      quantity: input.quantity,
      price: input.price,
      fees: input.fees,
      executed_at: input.executed_at,
      notes: input.notes?.trim() || null,
    })
    .eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/portfolio');
  return { ok: true };
}

export async function deleteTrade(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not signed in.' };

  const { error } = await supabase.from('trades').delete().eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/portfolio');
  return { ok: true };
}

export async function setCurrentPrice(
  ticker: string,
  price: number,
): Promise<ActionResult> {
  if (!ticker.trim()) return { error: 'Ticker is required.' };
  if (!Number.isFinite(price) || price < 0) {
    return { error: 'Price must be a non-negative number.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not signed in.' };

  // Upsert keyed on ticker (PK). Updates updated_at on every write.
  const { error } = await supabase
    .from('current_prices')
    .upsert(
      {
        ticker: ticker.trim(),
        price,
        currency: 'AUD',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'ticker' },
    );
  if (error) return { error: error.message };

  revalidatePath('/portfolio');
  return { ok: true };
}
