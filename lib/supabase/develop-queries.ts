import { createClient } from '@/lib/supabase/server';
import type { Conversation, Message, StressTest, OpusVerdict } from '@/lib/types';
import type { ModelKey, TokenUsage } from '@/lib/ai/pricing';

export async function getConversations(): Promise<Conversation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Conversation[];
}

export async function getConversationById(id: string): Promise<Conversation | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data as Conversation | null) ?? null;
}

export async function getMessagesFor(conversationId: string): Promise<Message[]> {
  // Filters out phase 2+ rows superseded by a later Iterate. Phase 1 rows are
  // never superseded so they pass through unaffected.
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .is('superseded_at', null)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Message[];
}

export async function getStressTestFor(
  conversationId: string,
): Promise<StressTest | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('stress_tests')
    .select('*')
    .eq('conversation_id', conversationId)
    .is('superseded_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as StressTest | null) ?? null;
}

export async function getAllVerdictsFor(
  conversationId: string,
): Promise<OpusVerdict[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('opus_verdicts')
    .select('*')
    .eq('conversation_id', conversationId)
    .is('superseded_at', null)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as OpusVerdict[];
}

export type UsageBreakdown = Record<ModelKey, TokenUsage>;

export async function getTokenUsageFor(
  conversationId: string,
): Promise<UsageBreakdown> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('messages')
    .select('model, metadata')
    .eq('conversation_id', conversationId);
  if (error) throw error;

  const empty = (): TokenUsage => ({ input_tokens: 0, output_tokens: 0 });
  const totals: UsageBreakdown = {
    'opus-4.7': empty(),
    'opus-4.8': empty(),
    'sonnet-4.6': empty(),
    'grok-4': empty(),
  };

  for (const row of data ?? []) {
    const model = row.model as ModelKey | null;
    if (!model || !(model in totals)) continue;
    const meta = (row.metadata ?? {}) as { input_tokens?: number; output_tokens?: number };
    totals[model].input_tokens += meta.input_tokens ?? 0;
    totals[model].output_tokens += meta.output_tokens ?? 0;
  }

  return totals;
}
