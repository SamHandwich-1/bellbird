import { streamText, type CoreMessage } from 'ai';
import { opus } from '@/lib/ai/anthropic';
import { buildPhase1SystemPrompt } from '@/lib/ai/prompts/phase-1-development';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Thesis } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const body = (await req.json()) as {
    conversationId: string;
    messages: CoreMessage[];
  };
  const { conversationId, messages } = body;
  if (!conversationId) {
    return new Response('Missing conversationId', { status: 400 });
  }

  const { data: thesesData } = await supabase.from('theses').select('*');
  const theses = (thesesData ?? []) as Thesis[];
  const system = buildPhase1SystemPrompt(theses);

  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');

  const result = streamText({
    model: opus,
    system,
    messages,
    onError: ({ error }) => {
      // Surface in `npm run dev` terminal — AI SDK v4 otherwise swallows this.
      console.error('[api/chat] streamText error:', error);
    },
    onFinish: async ({ text, usage }) => {
      const admin = createAdminClient();
      const rows: Array<{
        conversation_id: string;
        role: 'user' | 'assistant';
        content: string;
        model: string | null;
        phase: number;
        metadata: Record<string, unknown> | null;
      }> = [];
      if (lastUserMessage && typeof lastUserMessage.content === 'string') {
        rows.push({
          conversation_id: conversationId,
          role: 'user',
          content: lastUserMessage.content,
          model: null,
          phase: 1,
          metadata: null,
        });
      }
      rows.push({
        conversation_id: conversationId,
        role: 'assistant',
        content: text,
        model: 'opus-4.7',
        phase: 1,
        metadata: {
          input_tokens: usage.promptTokens ?? 0,
          output_tokens: usage.completionTokens ?? 0,
        },
      });
      await admin.from('messages').insert(rows);
      await admin
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);
    },
  });

  return result.toDataStreamResponse({
    getErrorMessage: (error) => {
      if (error instanceof Error) return error.message;
      if (typeof error === 'string') return error;
      try {
        return JSON.stringify(error);
      } catch {
        return 'Unknown error (non-serializable).';
      }
    },
  });
}
