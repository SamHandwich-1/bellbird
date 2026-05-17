import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { tokens } from '@/lib/tokens';
import type { Conversation } from '@/lib/types';

function statusLabel(s: Conversation['status']): string {
  switch (s) {
    case 'open':
      return 'Open';
    case 'phase_2':
      return 'Structuring';
    case 'phase_3':
      return 'Stress test';
    case 'phase_4':
      return 'Adjudicating';
    case 'completed':
      return 'Completed';
    case 'discarded':
      return 'Discarded';
  }
}

function statusColor(s: Conversation['status']): string {
  switch (s) {
    case 'completed':
      return tokens.sage;
    case 'discarded':
      return tokens.terracotta;
    case 'phase_4':
      return tokens.chime;
    case 'phase_3':
      return tokens.amber;
    case 'phase_2':
      return tokens.steel;
    default:
      return tokens.whisper;
  }
}

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
                <Link
                  key={c.id}
                  href={`/develop/${c.id}`}
                  className="lift-on-hover grid grid-cols-12 gap-3 items-baseline py-3 cursor-pointer"
                  style={{ borderBottom: `1px solid ${tokens.surface}` }}
                >
                  <div className="col-span-7">
                    <div
                      className="font-serif text-[19px] leading-[1.3]"
                      style={{ fontWeight: 360, color: tokens.ink }}
                    >
                      {c.title ?? 'Untitled conversation'}
                    </div>
                  </div>
                  <div
                    className="col-span-3 font-sans text-[10px] tracking-[0.16em] uppercase"
                    style={{ color: statusColor(c.status) }}
                  >
                    {statusLabel(c.status)}
                  </div>
                  <div
                    className="col-span-1 font-mono text-[10px] text-right"
                    style={{ color: tokens.whisper }}
                  >
                    {new Date(c.updated_at).toLocaleDateString('en', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="col-span-1 text-right" style={{ color: tokens.whisper }}>
                    <ChevronRight size={12} strokeWidth={1.5} />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
