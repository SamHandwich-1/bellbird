import Link from 'next/link';
import { notFound } from 'next/navigation';
import { tokens, cycleStageColor, convictionColor } from '@/lib/tokens';
import { getThesisById, getPositionsForThesis } from '@/lib/supabase/queries';
import { getTriggersForThesis } from '@/lib/supabase/triggers-queries';
import { Section } from '@/components/shared/Section';
import { ConvictionGauge } from '@/components/shared/ConvictionGauge';
import { PositionsTable } from '@/components/shared/PositionsTable';
import { PlannedSection } from '@/components/shared/PlannedSection';
import { TriggerDetailRow } from '@/components/shared/TriggerDetailRow';
import { TriggerRowActions } from '@/components/shared/TriggerRowActions';
import { AddTriggerButton } from '@/components/shared/AddTriggerButton';

export const dynamic = 'force-dynamic';

function convictionLabel(v: number): string {
  if (v < 40) return 'Low';
  if (v < 70) return 'Moderate';
  return 'High';
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

type Params = Promise<{ id: string }>;

export default async function ThesisDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const thesis = await getThesisById(id);
  if (!thesis) notFound();

  const positions = await getPositionsForThesis(thesis.id);
  const triggers = await getTriggersForThesis(thesis.id);
  const conv = convictionColor(thesis.conviction);
  const cyc = cycleStageColor(thesis.cycle_stage);

  return (
    <div>
      <Link
        href="/library"
        className="label btn-quiet"
        style={{
          color: tokens.muted,
          marginBottom: 32,
          display: 'inline-block',
          textDecoration: 'none',
        }}
      >
        ← Library
      </Link>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: 32,
          alignItems: 'start',
          marginBottom: 32,
        }}
      >
        <div>
          <div className="label" style={{ color: tokens.muted, marginBottom: 8 }}>
            Thesis · Established {formatDate(thesis.created_at)}
          </div>
          <h1
            className="serif"
            style={{
              fontSize: 40,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: tokens.text,
              margin: 0,
              lineHeight: 1.05,
            }}
          >
            {thesis.name}
          </h1>
          <div
            style={{
              display: 'flex',
              gap: 20,
              marginTop: 14,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            {thesis.sector && (
              <span
                className="mono"
                style={{
                  fontSize: 11,
                  color: tokens.muted,
                  letterSpacing: '0.04em',
                }}
              >
                {thesis.sector}
              </span>
            )}
            {thesis.cycle_stage && (
              <span className="label" style={{ color: cyc }}>
                {thesis.cycle_stage.replace('-', ' ')}
              </span>
            )}
            {thesis.in_portfolio && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: tokens.chime,
                    boxShadow: `0 0 6px ${tokens.chime}aa`,
                  }}
                />
                <span className="label" style={{ color: tokens.chime }}>
                  In portfolio
                </span>
              </span>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div
            className="mono nums"
            style={{ fontSize: 56, fontWeight: 700, color: conv, lineHeight: 1 }}
          >
            {thesis.conviction}
          </div>
          <div className="label" style={{ color: tokens.faint, marginTop: 8 }}>
            {convictionLabel(thesis.conviction)} conviction
          </div>
        </div>
      </div>

      <ConvictionGauge
        current={thesis.conviction}
        prior={null}
        lastUpdated={formatDate(thesis.updated_at)}
      />

      {thesis.summary && (
        <Section label="The thesis">
          <p
            className="serif"
            style={{ fontSize: 16, lineHeight: 1.65, color: tokens.body, margin: 0 }}
          >
            {thesis.summary}
          </p>
        </Section>
      )}

      {positions.length > 0 && (
        <Section
          label="Positions"
          right={`${positions.length} ${positions.length === 1 ? 'holding' : 'holdings'}`}
        >
          <PositionsTable positions={positions} />
        </Section>
      )}

      {thesis.hedge_note && (
        <Section label="Risk & hedge notes">
          <p
            className="serif"
            style={{ fontSize: 14.5, lineHeight: 1.6, color: tokens.body, margin: 0 }}
          >
            {thesis.hedge_note}
          </p>
        </Section>
      )}

      <Section
        label="Triggers"
        right={`${triggers.length} ${triggers.length === 1 ? 'trigger' : 'triggers'}`}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: triggers.length === 0 ? 12 : 4,
          }}
        >
          <AddTriggerButton thesisId={thesis.id} />
        </div>
        {triggers.length === 0 ? (
          <p
            className="serif"
            style={{
              fontSize: 13.5,
              fontStyle: 'italic',
              color: tokens.muted,
              margin: 0,
              lineHeight: 1.55,
            }}
          >
            No triggers yet. Add one to start tracking invalidation conditions.
          </p>
        ) : (
          triggers.map((t) => (
            <TriggerDetailRow
              key={t.id}
              trigger={t}
              actions={<TriggerRowActions trigger={t} />}
            />
          ))
        )}
      </Section>

      <PlannedSection
        label="Conviction history"
        sub="Timestamped trajectory of conviction changes, each linked to the discussion that produced it."
      />
      <PlannedSection
        label="Discussion log"
        sub="Original thesis-generation transcript and subsequent ingestion events, each as its own artifact."
      />
    </div>
  );
}
