import { opus } from '@/lib/ai/anthropic';
import { generateObjectGuarded, ParseGuardError } from '@/lib/ai/parse-guard';
import {
  PHASE_4_SYSTEM_PROMPT,
  buildChallengeContext,
} from '@/lib/ai/prompts/phase-4-adjudication';
import { adjudicationSchema } from '@/lib/ai/schemas';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
// 120s headroom for one parse-guard retry on top of a slow adjudication. The
// value is validated only by the Vercel build after push — nothing local
// exercises it. If the build rejects/clamps 120, fall back to 60.
export const maxDuration = 120;

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { conversationId, userChallenge } = (await req.json()) as {
    conversationId: string;
    userChallenge?: string;
  };
  if (!conversationId) return new Response('Missing conversationId', { status: 400 });

  // Find the ACTIVE stress test (filter superseded so prior iterations are ignored).
  const { data: stressTest, error: stErr } = await supabase
    .from('stress_tests')
    .select('*')
    .eq('conversation_id', conversationId)
    .is('superseded_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (stErr) return Response.json({ error: stErr.message }, { status: 500 });
  if (!stressTest) {
    return Response.json({ error: 'No stress test found. Run Phase 3 first.' }, { status: 400 });
  }

  // If this is a challenge, find the prior ACTIVE verdict (not a superseded one
  // from a prior iteration).
  let priorVerdict: { verdict: string; reasoning: string } | null = null;
  if (userChallenge) {
    const { data: prior } = await supabase
      .from('opus_verdicts')
      .select('verdict, reasoning')
      .eq('conversation_id', conversationId)
      .is('superseded_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (prior) priorVerdict = { verdict: prior.verdict, reasoning: prior.reasoning };
  }

  const promptParts: string[] = [
    `Structured thesis:\n${JSON.stringify(stressTest.thesis_snapshot, null, 2)}`,
    `Grok contrarian argument:\n${stressTest.contrarian_argument}`,
    `Disagreement matrix:\n${JSON.stringify(stressTest.disagreement_matrix, null, 2)}`,
  ];
  if (userChallenge && priorVerdict) {
    promptParts.push(
      buildChallengeContext(priorVerdict.verdict, priorVerdict.reasoning, userChallenge),
    );
  }
  const prompt = promptParts.join('\n\n');

  try {
    const { object, usage, guard } = await generateObjectGuarded({
      model: opus,
      system: PHASE_4_SYSTEM_PROMPT,
      schema: adjudicationSchema,
      prompt,
      phase: 4,
    });

    const admin = createAdminClient();
    const { data: verdictRow, error: insertErr } = await admin
      .from('opus_verdicts')
      .insert({
        conversation_id: conversationId,
        stress_test_id: stressTest.id,
        verdict: object.verdict,
        reasoning: object.reasoning,
        user_challenge: userChallenge ?? null,
        user_override: Boolean(userChallenge),
        final_decision: object.verdict,
      })
      .select('*')
      .single();
    if (insertErr) return Response.json({ error: insertErr.message }, { status: 500 });

    await admin.from('messages').insert({
      conversation_id: conversationId,
      role: 'assistant',
      content: object.reasoning,
      model: 'opus-4.7',
      phase: 4,
      metadata: {
        input_tokens: usage.promptTokens ?? 0,
        output_tokens: usage.completionTokens ?? 0,
        verdict: object.verdict,
        verdict_id: verdictRow.id,
        guard,
      },
    });
    await admin
      .from('conversations')
      .update({ status: 'phase_4', updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return Response.json({ ok: true, verdict: verdictRow });
  } catch (e) {
    if (e instanceof ParseGuardError) {
      console.error('[api/adjudicate] parse-guard exhausted:', e);
      return Response.json(
        {
          error:
            'Adjudication did not return a usable verdict after one retry. Nothing was saved — run it again.',
          code: e.code,
        },
        { status: 502 },
      );
    }
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[api/adjudicate] generateObject error:', e);
    return Response.json({ error: msg }, { status: 500 });
  }
}
