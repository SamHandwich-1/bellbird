'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowUpRight } from 'lucide-react';
import { tokens } from '@/lib/tokens';
import type { OpusVerdict, Verdict } from '@/lib/types';
import { commitToLibrary, discardConversation, resetToPhase1 } from '@/app/(app)/develop/actions';
import { ChallengeForm } from './ChallengeForm';

function verdictColor(v: Verdict): string {
  switch (v) {
    case 'PROCEED':
      return tokens.sage;
    case 'STRESS_TEST':
      return tokens.amber;
    case 'CLARIFY':
      return tokens.steel;
    case 'DISCARD':
      return tokens.terracotta;
  }
}

export function VerdictCard({
  verdict,
  conversationId,
  isLatest,
  onChallenge,
  onIterate,
}: {
  verdict: OpusVerdict;
  conversationId: string;
  isLatest: boolean;
  onChallenge: (challenge: string) => Promise<void>;
  onIterate?: () => Promise<void>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [challenging, setChallenging] = useState(false);

  function handleCommit() {
    startTransition(async () => {
      const result = await commitToLibrary(conversationId);
      if ('error' in result) {
        toast.error(result.error);
        return;
      }
      toast.success('Thesis committed to library.');
      router.push(`/library/${result.thesisId}`);
    });
  }

  function handleDiscard() {
    startTransition(async () => {
      const result = await discardConversation(conversationId);
      if ('error' in result) {
        toast.error(result.error);
        return;
      }
      toast.success('Conversation discarded.');
      router.push('/develop');
    });
  }

  function handleIterate() {
    // Prefer the parent-supplied callback (DevelopChat lifts this so it can
    // reset local state). Fall back to the inline server-action path only if
    // no callback was passed — should be rare/never in production but keeps
    // VerdictCard usable in isolation.
    if (onIterate) {
      startTransition(async () => {
        await onIterate();
      });
      return;
    }
    startTransition(async () => {
      const result = await resetToPhase1(conversationId);
      if ('error' in result) {
        toast.error(result.error);
        return;
      }
      toast.success('Returned to Phase 1. Continue the conversation.');
      router.refresh();
    });
  }

  async function handleChallenge(text: string) {
    await onChallenge(text);
    setChallenging(false);
  }

  return (
    <div
      className="p-6"
      style={{ background: tokens.paper, border: `1px solid ${verdictColor(verdict.verdict)}` }}
    >
      <div
        className="font-sans text-[10px] tracking-[0.22em] uppercase mb-4"
        style={{ color: tokens.whisper }}
      >
        Phase 4 · Adjudication{verdict.user_override ? ' · After challenge' : ''}
      </div>

      <div
        className="font-serif text-[36px] tracking-tight mb-4"
        style={{ fontWeight: 380, color: verdictColor(verdict.verdict) }}
      >
        {verdict.verdict.replace('_', ' ')}
      </div>

      <p
        className="font-serif text-[16px] leading-[1.65] mb-6"
        style={{ fontWeight: 340, color: tokens.ink, maxWidth: '62ch' }}
      >
        {verdict.reasoning}
      </p>

      {verdict.user_challenge && (
        <>
          <div
            className="font-sans text-[10px] tracking-[0.22em] uppercase mb-2"
            style={{ color: tokens.whisper }}
          >
            Your challenge
          </div>
          <p
            className="font-serif text-[14px] leading-[1.55] italic mb-6"
            style={{ fontWeight: 340, color: tokens.ash, maxWidth: '62ch' }}
          >
            {verdict.user_challenge}
          </p>
        </>
      )}

      {isLatest && (
        <div className="flex items-center gap-6 flex-wrap">
          {verdict.verdict === 'PROCEED' && (
            <button
              type="button"
              onClick={handleCommit}
              disabled={pending}
              className="font-sans text-[10px] tracking-[0.22em] uppercase btn-quiet inline-flex items-center gap-2"
              style={{
                color: tokens.ink,
                borderBottom: `1px solid ${tokens.ink}`,
                paddingBottom: 4,
                opacity: pending ? 0.5 : 1,
              }}
            >
              Commit to library <ArrowUpRight size={11} strokeWidth={1.5} />
            </button>
          )}
          {(verdict.verdict === 'STRESS_TEST' || verdict.verdict === 'CLARIFY') && (
            <button
              type="button"
              onClick={handleIterate}
              disabled={pending}
              className="font-sans text-[10px] tracking-[0.22em] uppercase btn-quiet"
              style={{
                color: tokens.ink,
                borderBottom: `1px solid ${tokens.ink}`,
                paddingBottom: 4,
                opacity: pending ? 0.5 : 1,
              }}
            >
              Iterate
            </button>
          )}
          {!challenging && (
            <button
              type="button"
              onClick={() => setChallenging(true)}
              disabled={pending}
              className="font-sans text-[10px] tracking-[0.22em] uppercase btn-quiet"
              style={{ color: tokens.chime }}
            >
              Challenge this verdict
            </button>
          )}
          {verdict.verdict !== 'PROCEED' && (
            <button
              type="button"
              onClick={handleDiscard}
              disabled={pending}
              className="font-sans text-[10px] tracking-[0.22em] uppercase btn-quiet"
              style={{ color: tokens.terracotta }}
            >
              Discard
            </button>
          )}
        </div>
      )}

      {challenging && (
        <ChallengeForm
          onSubmit={handleChallenge}
          onCancel={() => setChallenging(false)}
        />
      )}
    </div>
  );
}
