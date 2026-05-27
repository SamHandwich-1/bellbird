import Link from 'next/link';
import { tokens } from '@/lib/tokens';
import { getConversations } from '@/lib/supabase/develop-queries';
import { Section } from '@/components/shared/Section';
import { NewConversationButton } from '@/components/shared/develop/NewConversationButton';

export const dynamic = 'force-dynamic';

const STATUS_LABELS: Record<string, string> = {
  open: 'In progress',
  phase_2: 'Phase 2',
  phase_3: 'Phase 3',
  phase_4: 'Verdict',
  completed: 'Completed',
  discarded: 'Discarded',
};

function statusColor(status: string): string {
  switch (status) {
    case 'open':
      return tokens.chime;
    case 'completed':
      return tokens.sage;
    case 'discarded':
      return tokens.faint;
    default:
      return tokens.amber;
  }
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export default async function DevelopPage() {
  const conversations = await getConversations();
  const active = conversations.filter((c) => c.status !== 'discarded');

  return (
    <div>
      <div
        style={{
          marginBottom: 32,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <div className="label" style={{ color: tokens.muted, marginBottom: 6 }}>
            Thesis development
          </div>
          <h1
            className="serif"
            style={{
              fontSize: 36,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: tokens.text,
              margin: 0,
              lineHeight: 1.1,
            }}
          >
            Develop
          </h1>
        </div>
        <NewConversationButton />
      </div>

      <Section
        label="Conversations"
        right={`${active.length} active · ${conversations.length} total`}
      >
        {conversations.length === 0 ? (
          <p
            className="serif"
            style={{
              fontSize: 14,
              fontStyle: 'italic',
              color: tokens.muted,
              margin: '24px 0',
              textAlign: 'center',
            }}
          >
            No conversations yet. Start one.
          </p>
        ) : (
          conversations.map((c) => (
            <Link
              key={c.id}
              href={`/develop/${c.id}`}
              className="hairline-row btn-quiet"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 120px 120px',
                gap: 24,
                padding: '18px 4px',
                borderBottom: `1px solid ${tokens.line}`,
                alignItems: 'baseline',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <span
                className="serif"
                style={{
                  fontSize: 17,
                  fontWeight: 500,
                  color: tokens.text,
                }}
              >
                {c.title ?? 'Untitled conversation'}
              </span>
              <span className="label" style={{ color: statusColor(c.status) }}>
                {STATUS_LABELS[c.status] ?? c.status}
              </span>
              <span
                className="mono nums"
                style={{
                  fontSize: 10.5,
                  color: tokens.faint,
                  letterSpacing: '0.06em',
                  textAlign: 'right',
                }}
              >
                {formatDate(c.updated_at).toUpperCase()}
              </span>
            </Link>
          ))
        )}
      </Section>

      <p
        className="serif"
        style={{
          fontSize: 13,
          fontStyle: 'italic',
          color: tokens.faint,
          marginTop: 12,
          lineHeight: 1.55,
          maxWidth: '60ch',
        }}
      >
        Each conversation runs Opus → Phase 2 structuring → Grok stress test → Opus adjudication.
        Auto-saving after every reply.
      </p>

    </div>
  );
}
