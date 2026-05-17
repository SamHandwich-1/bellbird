'use client';

import type { Message, OpusVerdict, StressTest } from '@/lib/types';
import type { StructuredThesis } from '@/lib/ai/schemas';
import { ChatTurn } from './ChatTurn';
import { StructuredDraftCard } from './StructuredDraftCard';
import { StressTestCard } from './StressTestCard';
import { VerdictCard } from './VerdictCard';

export type StreamingMessage = { role: 'user' | 'assistant'; content: string };

type Phase1Speaker = 'user' | 'opus';

function phase1Speaker(role: 'user' | 'assistant'): Phase1Speaker {
  return role === 'user' ? 'user' : 'opus';
}

export function ChatThread({
  historicalMessages,
  streamingMessages,
  draft,
  stressTest,
  verdicts,
  conversationId,
  onChallenge,
  onIterate,
}: {
  historicalMessages: Message[];
  streamingMessages: StreamingMessage[];
  draft: StructuredThesis | null;
  stressTest: StressTest | null;
  verdicts: OpusVerdict[];
  conversationId: string;
  onChallenge: (text: string) => Promise<void>;
  onIterate?: () => Promise<void>;
}) {
  // Render Phase 1 messages — historical first (from DB), then live streaming
  const phase1Historical = historicalMessages.filter((m) => m.phase === 1);
  const historicalIds = new Set(phase1Historical.map((m) => `${m.role}::${m.content}`));
  const liveOnly = streamingMessages.filter(
    (m) => !historicalIds.has(`${m.role}::${m.content}`),
  );

  return (
    <div className="space-y-12">
      {phase1Historical.map((m) => (
        <ChatTurn key={m.id} speaker={phase1Speaker(m.role)} text={m.content} />
      ))}
      {liveOnly.map((m, i) => (
        <ChatTurn
          key={`live-${i}`}
          speaker={phase1Speaker(m.role)}
          text={m.content}
          streaming={m.role === 'assistant' && i === liveOnly.length - 1}
        />
      ))}

      {draft && <StructuredDraftCard draft={draft} />}

      {stressTest && <StressTestCard stressTest={stressTest} />}

      {verdicts.map((v, i) => (
        <VerdictCard
          key={v.id}
          verdict={v}
          conversationId={conversationId}
          isLatest={i === verdicts.length - 1}
          onChallenge={onChallenge}
          onIterate={onIterate}
        />
      ))}
    </div>
  );
}
