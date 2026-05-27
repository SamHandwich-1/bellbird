'use client';

// v2 Develop conversation pane. Mockup: references/bellbird-mockup-v2-stack.jsx
//
// Two-column layout (chat + ContextPane). The ConversationPane handles:
//  - Phase 1 message stream with iteration grouping (item 14)
//  - Markdown table rendering in bubbles (item 16)
//  - Prompt prefill chips after the latest Opus bubble (item 15)
//  - Attachment chips above the input (item 13)
//  - Voice button chrome (item 1 follow-up)
//  - Mark "Ready for review" → triggers Phase 2 → Phase 3 → Phase 4 in sequence
//  - Iterate and Commit wiring via Phase 4 verdict card

import { useMemo, useState, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useChat } from '@ai-sdk/react';
import { toast } from 'sonner';
import { tokens } from '@/lib/tokens';
import type {
  Conversation,
  Message,
  OpusVerdict,
  StressTest,
} from '@/lib/types';
import type { StructuredThesis } from '@/lib/ai/schemas';
import type { UploadedAttachment } from '@/lib/supabase/storage';
import { resetToPhase1 } from '@/app/(app)/develop/actions';
import { parseSuggestions } from '@/lib/develop/suggestions';

import { ChatBubble } from '../ChatBubble';
import { IterationDivider } from '../IterationDivider';
import { PromptPrefillChips } from '../PromptPrefillChips';
import { AttachmentButton } from '../AttachmentButton';
import { AttachmentChip } from '../AttachmentChip';
import { VoiceButton } from '../VoiceButton';
import { ContextPane } from '../ContextPane';
import { StructuredDraftCard } from './StructuredDraftCard';
import { StressTestCard } from './StressTestCard';
import { VerdictCard } from './VerdictCard';

type Phase2Meta = { structured?: StructuredThesis };

function extractDraft(messages: Message[]): StructuredThesis | null {
  const phase2 = messages.filter((m) => m.phase === 2).slice(-1)[0];
  if (!phase2) return null;
  return (phase2.metadata as Phase2Meta | null)?.structured ?? null;
}

function formatClockTime(iso: string): string {
  try {
    const d = new Date(iso);
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  } catch {
    return '';
  }
}

type ChatItem = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  iteration: number;
  time?: string;
};

async function callStructure(conversationId: string): Promise<StructuredThesis> {
  const res = await fetch('/api/structure', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ conversationId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Structure failed.' }));
    throw new Error(err.error ?? 'Structure failed.');
  }
  const { draft } = (await res.json()) as { draft: StructuredThesis };
  return draft;
}

async function callStress(conversationId: string): Promise<StressTest> {
  const res = await fetch('/api/stress-test', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ conversationId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Stress test failed.' }));
    throw new Error(err.error ?? 'Stress test failed.');
  }
  const { stressTest } = (await res.json()) as { stressTest: StressTest };
  return stressTest;
}

async function callAdjudicate(
  conversationId: string,
  userChallenge?: string,
): Promise<OpusVerdict> {
  const res = await fetch('/api/adjudicate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ conversationId, userChallenge }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Adjudication failed.' }));
    throw new Error(err.error ?? 'Adjudication failed.');
  }
  const { verdict } = (await res.json()) as { verdict: OpusVerdict };
  return verdict;
}

export function DevelopChat({
  conversation,
  initialMessages,
  initialStressTest,
  initialVerdicts,
}: {
  conversation: Conversation;
  initialMessages: Message[];
  initialStressTest: StressTest | null;
  initialVerdicts: OpusVerdict[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [pendingLabel, setPendingLabel] = useState<string | undefined>(undefined);

  const initialDraft = useMemo(() => extractDraft(initialMessages), [initialMessages]);
  const [draft, setDraft] = useState<StructuredThesis | null>(initialDraft);
  const [stressTest, setStressTest] = useState<StressTest | null>(initialStressTest);
  const [verdicts, setVerdicts] = useState<OpusVerdict[]>(initialVerdicts);

  const [pendingAttachments, setPendingAttachments] = useState<UploadedAttachment[]>([]);

  // The persisted Phase 1 history is the source of iteration grouping. The
  // useChat hook stores only the streaming-session messages, which inherit
  // the current iteration. New iterations only appear after a server reload
  // (resetToPhase1 -> router.refresh), so we can derive iteration from the
  // conversation row for the streaming tail.
  const phase1History = useMemo(
    () => initialMessages.filter((m) => m.phase === 1),
    [initialMessages],
  );

  const initialChatMessages = useMemo(
    () =>
      phase1History.map((m) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    [phase1History],
  );

  const { messages, input, setInput, handleSubmit, status } = useChat({
    api: '/api/chat',
    id: conversation.id,
    initialMessages: initialChatMessages,
    body: { conversationId: conversation.id },
    onError: (err) => {
      toast.error(`Chat error: ${err.message}`);
    },
  });

  const chatStreaming = status === 'streaming' || status === 'submitted';

  function sendMessage() {
    if (!input.trim() && pendingAttachments.length === 0) return;
    // The useChat hook supports a body override on each submit so we can
    // include the just-uploaded attachments.
    handleSubmit(undefined, {
      body: {
        conversationId: conversation.id,
        attachments: pendingAttachments,
      },
    });
    setPendingAttachments([]);
  }

  function onMarkReady() {
    if (messages.length < 2) {
      toast.error('Develop the thesis a little first.');
      return;
    }
    startTransition(async () => {
      try {
        setPendingLabel('Structuring');
        const newDraft = await callStructure(conversation.id);
        setDraft(newDraft);

        setPendingLabel('Stress-testing');
        const newStress = await callStress(conversation.id);
        setStressTest(newStress);

        setPendingLabel('Adjudicating');
        const newVerdict = await callAdjudicate(conversation.id);
        setVerdicts([newVerdict]);
        toast.success(`Verdict: ${newVerdict.verdict.replace('_', ' ')}.`);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Pipeline failed.');
      } finally {
        setPendingLabel(undefined);
      }
    });
  }

  const conversationId = conversation.id;
  const onChallenge = useCallback(
    async (text: string) => {
      try {
        setPendingLabel('Re-adjudicating');
        const newVerdict = await callAdjudicate(conversationId, text);
        setVerdicts((prev) => [...prev, newVerdict]);
        toast.success(`Revised verdict: ${newVerdict.verdict.replace('_', ' ')}.`);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Re-adjudication failed.');
      } finally {
        setPendingLabel(undefined);
      }
    },
    [router, conversationId],
  );

  const onIterate = useCallback(async () => {
    try {
      setPendingLabel('Returning to Phase 1');
      const result = await resetToPhase1(conversation.id);
      if ('error' in result) {
        toast.error(result.error);
        return;
      }
      setDraft(null);
      setStressTest(null);
      setVerdicts([]);
      toast.success('Returned to Phase 1. Continue the conversation.');
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Iterate failed.');
    } finally {
      setPendingLabel(undefined);
    }
  }, [conversation.id, router]);

  // Build the chat item list with iteration metadata. History rows carry
  // their persisted iteration; streaming tail rows inherit the conversation's
  // current iteration.
  const chatItems: ChatItem[] = useMemo(() => {
    const historyById = new Map(phase1History.map((m) => [m.id, m]));
    return messages.map((m) => {
      const hist = historyById.get(m.id);
      return {
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        iteration: hist?.iteration ?? conversation.iteration ?? 0,
        time: hist ? formatClockTime(hist.created_at) : undefined,
      };
    });
  }, [messages, phase1History, conversation.iteration]);

  const latestOpusContent = useMemo(() => {
    const lastOpus = [...chatItems].reverse().find((m) => m.role === 'assistant');
    return lastOpus?.content ?? '';
  }, [chatItems]);
  const latestSuggestions = useMemo(
    () => parseSuggestions(latestOpusContent).suggestions,
    [latestOpusContent],
  );

  const onPickSuggestion = useCallback(
    (s: string) => {
      setInput(s);
    },
    [setInput],
  );

  const showInput = verdicts.length === 0;

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div className="label" style={{ color: tokens.muted, marginBottom: 6 }}>
          {conversation.iteration > 0
            ? `Iteration ${conversation.iteration + 1} · auto-saving`
            : 'New thesis conversation · auto-saving'}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <h1
            className="serif"
            style={{
              fontSize: 32,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: tokens.text,
              margin: 0,
              lineHeight: 1.1,
            }}
          >
            {conversation.title ?? 'Untitled thesis'}
          </h1>
          <div
            className="mono nums"
            style={{ fontSize: 10.5, color: tokens.faint, letterSpacing: '0.08em' }}
          >
            {pendingLabel
              ? pendingLabel.toUpperCase()
              : verdicts.length > 0
                ? 'VERDICT IN'
                : stressTest
                  ? 'PHASE 3'
                  : draft
                    ? 'PHASE 2'
                    : 'PHASE 1 · DRAFT'}
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 320px',
          gap: 28,
          alignItems: 'start',
        }}
      >
        <div>
          <ChatStream
            items={chatItems}
            suggestions={latestSuggestions}
            onPickSuggestion={onPickSuggestion}
          />

          {draft && <StructuredDraftCard draft={draft} />}
          {stressTest && <StressTestCard stressTest={stressTest} />}
          {verdicts.map((v, i) => (
            <VerdictCard
              key={v.id}
              verdict={v}
              conversationId={conversation.id}
              isLatest={i === verdicts.length - 1}
              onChallenge={onChallenge}
              onIterate={onIterate}
            />
          ))}

          {showInput && (
            <>
              {pendingAttachments.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  {pendingAttachments.map((a, i) => (
                    <AttachmentChip
                      key={`${a.storage_path}-${i}`}
                      attachment={a}
                      onRemove={() =>
                        setPendingAttachments((prev) =>
                          prev.filter((p) => p.storage_path !== a.storage_path),
                        )
                      }
                    />
                  ))}
                </div>
              )}

              <div
                style={{
                  border: `1px solid ${tokens.line}`,
                  background: tokens.panel,
                  padding: '14px 16px',
                  marginBottom: 16,
                }}
              >
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Reply to Opus…"
                    rows={2}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      resize: 'none',
                      color: tokens.text,
                      fontFamily: 'Fraunces, serif',
                      fontSize: 14.5,
                      lineHeight: 1.5,
                    }}
                    disabled={chatStreaming}
                  />
                  <AttachmentButton
                    conversationId={conversation.id}
                    onUploaded={(att) => setPendingAttachments((prev) => [...prev, att])}
                  />
                  <VoiceButton />
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <span
                  className="mono"
                  style={{
                    fontSize: 10.5,
                    color: tokens.faint,
                    letterSpacing: '0.06em',
                  }}
                >
                  OPUS · PHASE 1
                  {chatStreaming ? '  ·  STREAMING' : ''}
                </span>
                <button
                  type="button"
                  onClick={onMarkReady}
                  disabled={chatStreaming || pending || messages.length < 2}
                  style={{
                    background: 'transparent',
                    border: `1px solid ${tokens.chime}`,
                    color: tokens.chime,
                    padding: '8px 18px',
                    cursor:
                      chatStreaming || pending || messages.length < 2 ? 'not-allowed' : 'pointer',
                    fontFamily: 'JetBrains Mono, ui-monospace, monospace',
                    fontSize: 10,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    opacity:
                      chatStreaming || pending || messages.length < 2 ? 0.5 : 1,
                  }}
                >
                  Ready for review →
                </button>
              </div>
            </>
          )}
        </div>

        <ContextPane />
      </div>
    </div>
  );
}

function ChatStream({
  items,
  suggestions,
  onPickSuggestion,
}: {
  items: ChatItem[];
  suggestions: string[];
  onPickSuggestion: (s: string) => void;
}) {
  if (items.length === 0) {
    return (
      <div style={{ marginBottom: 20 }}>
        <ChatBubble role="opus">
          {`Start with what's mispriced or unpriced. What's the load-bearing claim?\n\nDescribe the thesis fragment — sector, mechanism, what the market is missing. I'll push back, surface what's actually at stake, and we'll develop it until it's ready for structuring.`}
        </ChatBubble>
      </div>
    );
  }

  // Walk items, inserting IterationDivider where iteration increments.
  const blocks: React.ReactNode[] = [];
  let prevIteration: number | null = null;
  for (const item of items) {
    if (prevIteration !== null && item.iteration > prevIteration) {
      blocks.push(<IterationDivider key={`div-${item.iteration}`} iteration={item.iteration} />);
    }
    prevIteration = item.iteration;
    if (item.role === 'assistant') {
      const { body } = parseSuggestions(item.content);
      blocks.push(
        <ChatBubble key={item.id} role="opus" time={item.time}>
          {body || item.content}
        </ChatBubble>,
      );
    } else {
      blocks.push(
        <ChatBubble key={item.id} role="user" time={item.time}>
          {item.content}
        </ChatBubble>,
      );
    }
  }

  return (
    <div style={{ marginBottom: 20 }}>
      {blocks}
      <PromptPrefillChips suggestions={suggestions} onPick={onPickSuggestion} />
    </div>
  );
}
