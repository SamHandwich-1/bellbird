import { tokens } from '@/lib/tokens';
import type { Conversation } from '@/lib/types';
import { ConversationListRow } from './ConversationListRow';

const GROUPS: Array<{ key: 'in_progress' | 'completed' | 'discarded'; label: string }> = [
  { key: 'in_progress', label: 'In progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'discarded', label: 'Discarded' },
];

function bucketOf(c: Conversation): 'in_progress' | 'completed' | 'discarded' {
  if (c.status === 'completed') return 'completed';
  if (c.status === 'discarded') return 'discarded';
  return 'in_progress';
}

export function ConversationList({ conversations }: { conversations: Conversation[] }) {
  const buckets = {
    in_progress: [] as Conversation[],
    completed: [] as Conversation[],
    discarded: [] as Conversation[],
  };
  for (const c of conversations) buckets[bucketOf(c)].push(c);

  if (conversations.length === 0) {
    return (
      <p
        className="font-serif text-[17px] leading-[1.55] max-w-[58ch]"
        style={{ fontWeight: 340, color: tokens.ash }}
      >
        No conversations yet. Start one — it will appear here grouped by status.
      </p>
    );
  }

  return (
    <div className="space-y-12">
      {GROUPS.map((g) => {
        const list = buckets[g.key];
        if (list.length === 0) return null;
        return (
          <section key={g.key}>
            <div
              className="font-sans text-[10px] tracking-[0.22em] uppercase mb-6"
              style={{ color: tokens.whisper }}
            >
              {g.label} · <span className="font-mono">{list.length}</span>
            </div>
            <div className="space-y-3">
              {list.map((c) => (
                <ConversationListRow key={c.id} conversation={c} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
