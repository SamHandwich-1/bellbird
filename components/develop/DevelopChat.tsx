'use client';

import { useMemo, useState, useTransition, useCallback } from 'react';
import { useChat } from '@ai-sdk/react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { PhaseProgression, type Phase } from './PhaseProgression';
import { CostMeter, type UsageBreakdown } from './CostMeter';
import { ChatThread } from './ChatThread';
import { ComposerBox } from './ComposerBox';
import { InlineEditableTitle } from './InlineEditableTitle';
import type { Conversation, Message, StressTest, OpusVerdict } from '@/lib/types';
import type { StructuredThesis } from '@/lib/ai/schemas';
import { resetToPhase1 } from '@/app/(app)/develop/actions';

type Phase2MessageMeta = {
  input_tokens?: number;
  output_tokens?: number;
  structured?: StructuredThesis;
};

function deriveActivePhase(conversation: Conversation): Phase {
  // Single source of truth: conversation.status. The Iterate flow soft-supersedes
  // pipeline rows in the DB, so when status='open' the historical rows are
  // already filtered out by the queries — no need to check their existence here.
  switch (conversation.status) {
    case 'phase_4':
    case 'completed':
    case 'discarded':
      return 4;
    case 'phase_3':
      return 3;
    case 'phase_2':
      return 2;
    case 'open':
    default:
      return 1;
  }
}

function extractLatestDraft(messages: Message[]): StructuredThesis | null {
  const phase2 = messages.filter((m) => m.phase === 2).slice(-1)[0];
  if (!phase2) return null;
  const meta = (phase2.metadata ?? {}) as Phase2MessageMeta;
  return meta.structured ?? null;
}

export function DevelopChat({
  conversation,
  initialMessages,
  initialStressTest,
  initialVerdicts,
  initialUsage,
}: {
  conversation: Conversation;
  initialMessages: Message[];
  initialStressTest: StressTest | null;
  initialVerdicts: OpusVerdict[];
  initialUsage: UsageBreakdown;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [pendingLabel, setPendingLabel] = useState<string | undefined>(undefined);

  const initialDraft = useMemo(() => extractLatestDraft(initialMessages), [initialMessages]);
  const [draft, setDraft] = useState<StructuredThesis | null>(initialDraft);
  const [stressTest, setStressTest] = useState<StressTest | null>(initialStressTest);
  const [verdicts, setVerdicts] = useState<OpusVerdict[]>(initialVerdicts);
  const [usage, setUsage] = useState<UsageBreakdown>(initialUsage);
  const [activePhase, setActivePhase] = useState<Phase>(
    deriveActivePhase(conversation),
  );

  const initialPhase1ChatMessages = useMemo(
    () =>
      initialMessages
        .filter((m) => m.phase === 1)
        .map((m) => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
    [initialMessages],
  );

  const { messages, input, setInput, handleSubmit, status } = useChat({
    api: '/api/chat',
    id: conversation.id,
    initialMessages: initialPhase1ChatMessages,
    body: { conversationId: conversation.id },
    onFinish: (msg, { usage: streamUsage }) => {
      // Add Opus token usage to running totals
      setUsage((prev) => ({
        ...prev,
        'opus-4.7': {
          input_tokens: prev['opus-4.7'].input_tokens + (streamUsage?.promptTokens ?? 0),
          output_tokens: prev['opus-4.7'].output_tokens + (streamUsage?.completionTokens ?? 0),
        },
      }));
    },
    onError: (err) => {
      toast.error(`Chat error: ${err.message}`);
    },
  });

  const chatStreaming = status === 'streaming' || status === 'submitted';

  const onSubmitMessage = useCallback(() => {
    if (!input.trim()) return;
    handleSubmit();
  }, [input, handleSubmit]);

  async function runStructurePhase(): Promise<StructuredThesis | null> {
    const res = await fetch('/api/structure', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ conversationId: conversation.id }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Structure call failed.' }));
      throw new Error(err.error ?? 'Structure call failed.');
    }
    const { draft: newDraft } = (await res.json()) as { draft: StructuredThesis };
    return newDraft;
  }

  async function runStressTestPhase(): Promise<StressTest> {
    const res = await fetch('/api/stress-test', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ conversationId: conversation.id }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Stress test call failed.' }));
      throw new Error(err.error ?? 'Stress test call failed.');
    }
    const { stressTest: row } = (await res.json()) as { stressTest: StressTest };
    return row;
  }

  async function runAdjudicatePhase(challenge?: string): Promise<OpusVerdict> {
    const res = await fetch('/api/adjudicate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ conversationId: conversation.id, userChallenge: challenge }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Adjudicate call failed.' }));
      throw new Error(err.error ?? 'Adjudicate call failed.');
    }
    const { verdict: row } = (await res.json()) as { verdict: OpusVerdict };
    return row;
  }

  function onMarkReady() {
    if (messages.length < 2) {
      toast.error('Develop the thesis a little first.');
      return;
    }
    startTransition(async () => {
      try {
        setActivePhase(2);
        setPendingLabel('Structuring');
        const newDraft = await runStructurePhase();
        if (!newDraft) throw new Error('Empty structured draft.');
        setDraft(newDraft);

        setActivePhase(3);
        setPendingLabel('Stress-testing');
        const newStressTest = await runStressTestPhase();
        setStressTest(newStressTest);

        setActivePhase(4);
        setPendingLabel('Adjudicating');
        const newVerdict = await runAdjudicatePhase();
        setVerdicts([newVerdict]);
        setPendingLabel(undefined);
        toast.success(`Verdict: ${newVerdict.verdict.replace('_', ' ')}.`);
        // Refresh usage from server (authoritative source)
        router.refresh();
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Pipeline failed.';
        toast.error(msg);
        setPendingLabel(undefined);
      }
    });
  }

  const conversationId = conversation.id;
  const onChallenge = useCallback(
    async (text: string) => {
      try {
        setPendingLabel('Re-adjudicating');
        const res = await fetch('/api/adjudicate', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ conversationId, userChallenge: text }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Re-adjudication failed.' }));
          throw new Error(err.error ?? 'Re-adjudication failed.');
        }
        const { verdict: newVerdict } = (await res.json()) as { verdict: OpusVerdict };
        setVerdicts((prev) => [...prev, newVerdict]);
        toast.success(`Revised verdict: ${newVerdict.verdict.replace('_', ' ')}.`);
        router.refresh();
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Re-adjudication failed.';
        toast.error(msg);
      } finally {
        setPendingLabel(undefined);
      }
    },
    [router, conversationId],
  );

  const onIterate = useCallback(async () => {
    try {
      setPendingLabel('Returning to Phase 1');
      const result = await resetToPhase1(conversationId);
      if ('error' in result) {
        toast.error(result.error);
        return;
      }
      // Local state matches the post-Iterate DB state: status='open', historical
      // pipeline rows soft-superseded and thus invisible to the queries on next
      // load. Reset client state to align with that view.
      setActivePhase(1);
      setDraft(null);
      setStressTest(null);
      setVerdicts([]);
      toast.success('Returned to Phase 1. Continue the conversation.');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Iterate failed.';
      toast.error(msg);
    } finally {
      setPendingLabel(undefined);
    }
  }, [conversationId]);

  const phase1HistoricalMessages = useMemo(
    () => initialMessages.filter((m) => m.phase === 1),
    [initialMessages],
  );

  const streamingMessages = messages.map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  const highestReached: Phase = (Math.max(
    activePhase,
    initialVerdicts.length > 0 ? 4 : stressTest ? 3 : draft ? 2 : 1,
  ) as Phase);

  const readyDisabled =
    activePhase > 1 || chatStreaming || messages.length < 2 || pending;

  return (
    <div className="pt-12">
      <div className="mb-2">
        <div
          className="font-sans text-[10px] tracking-[0.22em] uppercase mb-2"
          style={{ color: 'var(--whisper, #9A9485)' }}
        >
          Develop
        </div>
        <InlineEditableTitle conversation={conversation} />
      </div>

      <div className="mt-8 mb-10">
        <PhaseProgression active={activePhase} highestReached={highestReached} />
      </div>

      <div className="hairline mb-12" />

      <ChatThread
        historicalMessages={phase1HistoricalMessages}
        streamingMessages={streamingMessages}
        draft={draft}
        stressTest={stressTest}
        verdicts={verdicts}
        conversationId={conversation.id}
        onChallenge={onChallenge}
        onIterate={onIterate}
      />

      {activePhase === 1 && (
        <div className="mt-12">
          <ComposerBox
            value={input}
            onChange={setInput}
            onSubmit={onSubmitMessage}
            onMarkReady={onMarkReady}
            pending={chatStreaming || pending}
            readyDisabled={readyDisabled}
            pendingLabel={pendingLabel}
            rightSlot={<CostMeter usage={usage} />}
          />
        </div>
      )}

      {activePhase > 1 && (
        <div className="mt-12 flex items-center justify-end">
          <CostMeter usage={usage} />
        </div>
      )}
    </div>
  );
}
