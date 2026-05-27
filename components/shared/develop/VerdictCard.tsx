'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowUpRight } from 'lucide-react';
import { tokens } from '@/lib/tokens';
import type { OpusVerdict, Verdict } from '@/lib/types';
import {
  commitToLibrary,
  discardConversation,
} from '@/app/(app)/develop/actions';
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
  onIterate: () => Promise<void>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [challenging, setChallenging] = useState(false);
  const color = verdictColor(verdict.verdict);

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
    startTransition(async () => {
      await onIterate();
    });
  }

  async function handleChallenge(text: string) {
    await onChallenge(text);
    setChallenging(false);
  }

  return (
    <div
      style={{
        background: tokens.panel,
        border: `1px solid ${color}`,
        padding: 24,
        marginBottom: 24,
      }}
    >
      <div className="label" style={{ color: tokens.muted, marginBottom: 14 }}>
        Phase 4 · Adjudication{verdict.user_override ? ' · After challenge' : ''}
      </div>

      <div
        className="serif"
        style={{
          fontSize: 32,
          fontWeight: 600,
          letterSpacing: '-0.01em',
          color,
          margin: '0 0 14px',
        }}
      >
        {verdict.verdict.replace('_', ' ')}
      </div>

      <p
        className="serif"
        style={{
          fontSize: 15.5,
          lineHeight: 1.65,
          color: tokens.body,
          margin: '0 0 22px',
          maxWidth: '60ch',
        }}
      >
        {verdict.reasoning}
      </p>

      {verdict.user_challenge && (
        <>
          <div className="label" style={{ color: tokens.muted, marginBottom: 6 }}>
            Your challenge
          </div>
          <p
            className="serif"
            style={{
              fontSize: 14,
              lineHeight: 1.55,
              fontStyle: 'italic',
              color: tokens.muted,
              margin: '0 0 22px',
              maxWidth: '60ch',
            }}
          >
            {verdict.user_challenge}
          </p>
        </>
      )}

      {isLatest && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 22,
            flexWrap: 'wrap',
          }}
        >
          {verdict.verdict === 'PROCEED' && (
            <ActionLink
              color={tokens.chime}
              disabled={pending}
              onClick={handleCommit}
              icon={<ArrowUpRight size={11} strokeWidth={1.5} />}
            >
              Commit to library
            </ActionLink>
          )}
          {(verdict.verdict === 'STRESS_TEST' || verdict.verdict === 'CLARIFY') && (
            <ActionLink color={tokens.text} disabled={pending} onClick={handleIterate}>
              Iterate
            </ActionLink>
          )}
          {!challenging && (
            <ActionLink
              color={tokens.chime}
              underline={false}
              disabled={pending}
              onClick={() => setChallenging(true)}
            >
              Challenge this verdict
            </ActionLink>
          )}
          {verdict.verdict !== 'PROCEED' && (
            <ActionLink
              color={tokens.terracotta}
              underline={false}
              disabled={pending}
              onClick={handleDiscard}
            >
              Discard
            </ActionLink>
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

function ActionLink({
  color,
  onClick,
  disabled,
  underline = true,
  icon,
  children,
}: {
  color: string;
  onClick: () => void;
  disabled?: boolean;
  underline?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="label btn-quiet"
      style={{
        color,
        background: 'transparent',
        border: 'none',
        borderBottom: underline ? `1px solid ${color}` : 'none',
        paddingBottom: underline ? 4 : 0,
        cursor: disabled ? 'wait' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      {children}
      {icon}
    </button>
  );
}
