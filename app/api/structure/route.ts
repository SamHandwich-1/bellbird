import { resolveForPhase } from '@/lib/ai/resolve';
import { generateObjectGuarded, ParseGuardError } from '@/lib/ai/parse-guard';
import { PHASE_2_SYSTEM_PROMPT } from '@/lib/ai/prompts/phase-2-structuring';
import { structuredThesisSchema } from '@/lib/ai/schemas';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
// 120s headroom for one parse-guard retry. Validated only by the Vercel build
// after push — falls back to 60 if the build rejects/clamps 120.
export const maxDuration = 120;

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
    const { model, dbLabel } = resolveForPhase(2);
    const { object, usage, guard } = await generateObjectGuarded({
      model,
      system: PHASE_2_SYSTEM_PROMPT,
      schema: structuredThesisSchema,
      prompt: `Conversation transcript:\n\n${transcript}\n\nProduce the structured thesis record.`,
      phase: 2,
    });

    const admin = createAdminClient();
    await admin.from('messages').insert({
      conversation_id: conversationId,
      role: 'assistant',
      content: JSON.stringify(object),
      model: dbLabel,
      phase: 2,
      metadata: {
        input_tokens: usage.promptTokens ?? 0,
        output_tokens: usage.completionTokens ?? 0,
        structured: object,
        guard,
      },
    });
    await admin
      .from('conversations')
      .update({ status: 'phase_2', updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return Response.json({ ok: true, draft: object });
  } catch (e) {
    if (e instanceof ParseGuardError) {
      console.error('[api/structure] parse-guard exhausted:', e);
      return Response.json(
        {
          error:
            'Structuring did not return a usable record after one retry. Nothing was saved — run it again.',
          code: e.code,
        },
        { status: 502 },
      );
    }
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[api/structure] generateObject error:', e);
    return Response.json({ error: msg }, { status: 500 });
  }
}
