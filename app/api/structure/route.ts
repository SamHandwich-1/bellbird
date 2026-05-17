import { generateObject } from 'ai';
import { sonnet } from '@/lib/ai/anthropic';
import { PHASE_2_SYSTEM_PROMPT } from '@/lib/ai/prompts/phase-2-structuring';
import { structuredThesisSchema } from '@/lib/ai/schemas';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { conversationId } = (await req.json()) as { conversationId: string };
  if (!conversationId) return new Response('Missing conversationId', { status: 400 });

  const { data: messages, error: msgErr } = await supabase
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .eq('phase', 1)
    .order('created_at', { ascending: true });
  if (msgErr) return Response.json({ error: msgErr.message }, { status: 500 });

  const transcript = (messages ?? [])
    .map((m) => `${m.role === 'user' ? 'James' : 'Opus'}: ${m.content}`)
    .join('\n\n');

  if (!transcript.trim()) {
    return Response.json({ error: 'No Phase 1 messages to structure.' }, { status: 400 });
  }

  try {
    const result = await generateObject({
      model: sonnet,
      system: PHASE_2_SYSTEM_PROMPT,
      schema: structuredThesisSchema,
      prompt: `Conversation transcript:\n\n${transcript}\n\nProduce the structured thesis record.`,
    });

    const admin = createAdminClient();
    await admin.from('messages').insert({
      conversation_id: conversationId,
      role: 'assistant',
      content: JSON.stringify(result.object),
      model: 'sonnet-4.6',
      phase: 2,
      metadata: {
        input_tokens: result.usage.promptTokens ?? 0,
        output_tokens: result.usage.completionTokens ?? 0,
        structured: result.object,
      },
    });
    await admin
      .from('conversations')
      .update({ status: 'phase_2', updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return Response.json({ ok: true, draft: result.object });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[api/structure] generateObject error:', e);
    return Response.json({ error: msg }, { status: 500 });
  }
}
