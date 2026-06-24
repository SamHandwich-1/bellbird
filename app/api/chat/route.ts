import { streamText, type CoreMessage } from 'ai';
import { resolveForPhase } from '@/lib/ai/resolve';
import { buildPhase1SystemPrompt } from '@/lib/ai/prompts/phase-1-development';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAttachmentSignedUrl } from '@/lib/supabase/storage-server';
import type { Thesis } from '@/lib/types';
import type { UploadedAttachment } from '@/lib/supabase/storage';

export const runtime = 'nodejs';
export const maxDuration = 60;

type ChatRequestBody = {
  conversationId: string;
  messages: CoreMessage[];
  attachments?: UploadedAttachment[];
};

async function buildAttachmentParts(attachments: UploadedAttachment[]) {
  const parts: Array<
    | { type: 'image'; image: Uint8Array; mimeType: string }
    | { type: 'file'; data: Uint8Array; mimeType: string }
  > = [];

  for (const att of attachments) {
    const url = await getAttachmentSignedUrl(att.storage_path);
    if (!url) continue;
    const res = await fetch(url);
    if (!res.ok) continue;
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (att.kind === 'image') {
      parts.push({ type: 'image', image: bytes, mimeType: att.mime_type });
    } else if (att.kind === 'pdf') {
      parts.push({ type: 'file', data: bytes, mimeType: att.mime_type });
    }
  }
  return parts;
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const body = (await req.json()) as ChatRequestBody;
  const { conversationId, messages, attachments = [] } = body;
  if (!conversationId) {
    return new Response('Missing conversationId', { status: 400 });
  }

  const { data: thesesData } = await supabase.from('theses').select('*');
  const theses = (thesesData ?? []) as Thesis[];
  const system = buildPhase1SystemPrompt(theses);

  // Inline binary attachments into the most recent user turn as multi-part
  // content blocks so Opus sees image / PDF context alongside the text.
  let effectiveMessages = messages;
  const lastUserIdx = [...messages].map((m) => m.role).lastIndexOf('user');
  if (attachments.length > 0 && lastUserIdx !== -1) {
    const attachmentParts = await buildAttachmentParts(attachments);
    if (attachmentParts.length > 0) {
      const original = messages[lastUserIdx];
      const textContent =
        typeof original.content === 'string'
          ? original.content
          : original.content
              .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
              .map((p) => p.text)
              .join('\n');
      const merged: CoreMessage = {
        role: 'user',
        content: [
          ...attachmentParts,
          { type: 'text', text: textContent },
        ],
      };
      effectiveMessages = messages.map((m, i) => (i === lastUserIdx ? merged : m));
    }
  }

  const lastUserMessage = messages[lastUserIdx] ?? null;
  const userText =
    lastUserMessage && typeof lastUserMessage.content === 'string'
      ? lastUserMessage.content
      : null;

  const { model, dbLabel } = resolveForPhase(1);
  const result = streamText({
    model,
    system,
    messages: effectiveMessages,
    onError: ({ error }) => {
      // Surface in `npm run dev` terminal — AI SDK v4 otherwise swallows this.
      console.error('[api/chat] streamText error:', error);
    },
    onFinish: async ({ text, usage }) => {
      const admin = createAdminClient();

      // Iteration index read from the conversation row. resetToPhase1 bumps
      // the counter on iterate; new conversations start at 0.
      const { data: convRow } = await admin
        .from('conversations')
        .select('iteration')
        .eq('id', conversationId)
        .maybeSingle();
      const iteration = convRow?.iteration ?? 0;

      const userInsert =
        userText != null
          ? {
              conversation_id: conversationId,
              role: 'user' as const,
              content: userText,
              model: null,
              phase: 1,
              metadata: null,
              iteration,
            }
          : null;

      let userMessageId: string | null = null;
      if (userInsert) {
        const { data: inserted, error: userErr } = await admin
          .from('messages')
          .insert(userInsert)
          .select('id')
          .single();
        if (userErr) {
          console.error('[api/chat] user message insert failed', userErr);
        } else {
          userMessageId = inserted?.id ?? null;
        }
      }

      if (userMessageId && attachments.length > 0) {
        const attRows = attachments.map((a) => ({
          message_id: userMessageId,
          kind: a.kind,
          storage_path: a.storage_path,
          filename: a.filename,
          mime_type: a.mime_type,
          size_bytes: a.size_bytes,
          content_text: null,
        }));
        const { error: attErr } = await admin.from('attachments').insert(attRows);
        if (attErr) console.error('[api/chat] attachment insert failed', attErr);
      }

      const { error: asstErr } = await admin.from('messages').insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: text,
        model: dbLabel,
        phase: 1,
        metadata: {
          input_tokens: usage.promptTokens ?? 0,
          output_tokens: usage.completionTokens ?? 0,
        },
        iteration,
      });
      if (asstErr) console.error('[api/chat] assistant message insert failed', asstErr);

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
