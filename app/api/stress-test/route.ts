import { generateObject } from 'ai';
import { grok } from '@/lib/ai/xai';
import { PHASE_3_SYSTEM_PROMPT } from '@/lib/ai/prompts/phase-3-stress-test';
import { stressTestSchema } from '@/lib/ai/schemas';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const maxDuration = 60;

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
    const result = await generateObject({
      model: grok,
      system: PHASE_3_SYSTEM_PROMPT,
      schema: stressTestSchema,
      prompt: `Structured thesis to pressure-test:\n\n${JSON.stringify(draft, null, 2)}\n\nProduce the contrarian argument and disagreement matrix.`,
    });

    const admin = createAdminClient();
    const { data: stressTestRow, error: insertErr } = await admin
      .from('stress_tests')
      .insert({
        conversation_id: conversationId,
        thesis_snapshot: draft as Record<string, unknown>,
        contrarian_argument: result.object.contrarian_argument,
        disagreement_matrix: result.object.disagreement_matrix,
      })
      .select('*')
      .single();
    if (insertErr) return Response.json({ error: insertErr.message }, { status: 500 });

    await admin.from('messages').insert({
      conversation_id: conversationId,
      role: 'assistant',
      content: result.object.contrarian_argument,
      model: 'grok-4',
      phase: 3,
      metadata: {
        input_tokens: result.usage.promptTokens ?? 0,
        output_tokens: result.usage.completionTokens ?? 0,
        stress_test_id: stressTestRow.id,
      },
    });
    await admin
      .from('conversations')
      .update({ status: 'phase_3', updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return Response.json({ ok: true, stressTest: stressTestRow });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[api/stress-test] generateObject error:', e);
    return Response.json({ error: msg }, { status: 500 });
  }
}
