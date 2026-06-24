import { resolveForPhase } from '@/lib/ai/resolve';
import { generateObjectGuarded, ParseGuardError } from '@/lib/ai/parse-guard';
import { PHASE_3_SYSTEM_PROMPT } from '@/lib/ai/prompts/phase-3-stress-test';
import { stressTestSchema } from '@/lib/ai/schemas';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
// 120s headroom for one parse-guard retry. Validated only by the Vercel build
// after push — falls back to 60 if the build rejects/clamps 120.
export const maxDuration = 120;

type Phase2MessageMeta = {
  input_tokens?: number;
  output_tokens?: number;
  structured?: unknown;
};

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { conversationId } = (await req.json()) as { conversationId: string };
  if (!conversationId) return new Response('Missing conversationId', { status: 400 });

  // Find most recent ACTIVE Phase 2 message (the structured draft).
  // Filter superseded so prior-iteration drafts don't get picked up after Iterate.
  const { data: phase2Row, error: phase2Err } = await supabase
    .from('messages')
    .select('metadata')
    .eq('conversation_id', conversationId)
    .eq('phase', 2)
    .is('superseded_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (phase2Err) return Response.json({ error: phase2Err.message }, { status: 500 });
  if (!phase2Row) {
    return Response.json({ error: 'No structured draft found. Run Phase 2 first.' }, { status: 400 });
  }

  const meta = (phase2Row.metadata ?? {}) as Phase2MessageMeta;
  const draft = meta.structured;
  if (!draft) {
    return Response.json({ error: 'Phase 2 row missing structured draft.' }, { status: 500 });
  }

  try {
    const { model, dbLabel } = resolveForPhase(3);
    const { object, usage, guard } = await generateObjectGuarded({
      model,
      system: PHASE_3_SYSTEM_PROMPT,
      schema: stressTestSchema,
      prompt: `Structured thesis to pressure-test:\n\n${JSON.stringify(draft, null, 2)}\n\nProduce the contrarian argument and disagreement matrix.`,
      phase: 3,
    });

    const admin = createAdminClient();
    const { data: stressTestRow, error: insertErr } = await admin
      .from('stress_tests')
      .insert({
        conversation_id: conversationId,
        thesis_snapshot: draft as Record<string, unknown>,
        contrarian_argument: object.contrarian_argument,
        disagreement_matrix: object.disagreement_matrix,
      })
      .select('*')
      .single();
    if (insertErr) return Response.json({ error: insertErr.message }, { status: 500 });

    await admin.from('messages').insert({
      conversation_id: conversationId,
      role: 'assistant',
      content: object.contrarian_argument,
      model: dbLabel,
      phase: 3,
      metadata: {
        input_tokens: usage.promptTokens ?? 0,
        output_tokens: usage.completionTokens ?? 0,
        stress_test_id: stressTestRow.id,
        guard,
      },
    });
    await admin
      .from('conversations')
      .update({ status: 'phase_3', updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return Response.json({ ok: true, stressTest: stressTestRow });
  } catch (e) {
    if (e instanceof ParseGuardError) {
      console.error('[api/stress-test] parse-guard exhausted:', e);
      return Response.json(
        {
          error:
            'The stress test did not return a usable structure after one retry. Nothing was saved — run it again.',
          code: e.code,
        },
        { status: 502 },
      );
    }
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[api/stress-test] generateObject error:', e);
    return Response.json({ error: msg }, { status: 500 });
  }
}
