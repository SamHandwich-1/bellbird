// Watch mode — new in Turn B. Mockup: references/bellbird-mockup-v2-stack.jsx
//
// Per Turn B interview decision 3: functional skeleton with real data only.
// Trigger pills, gamma arrows, and conviction-delta render as em-dashes
// until items 7 (triggers schema), 9 (conviction history), and the
// downstream data fetcher land. Watch full wiring is a follow-up turn.

import Link from 'next/link';
import { tokens, cycleStageColor, convictionColor, formatStage } from '@/lib/tokens';
import { createClient } from '@/lib/supabase/server';
import { getTheses } from '@/lib/supabase/queries';
import { GammaArrow } from '@/components/shared/GammaArrow';

export const dynamic = 'force-dynamic';

type WatchSearchParams = Promise<{ view?: string }>;

export default async function WatchPage({
  searchParams,
}: {
  searchParams: WatchSearchParams;
}) {
  const params = await searchParams;
  const view = params.view === 'portfolio' ? 'portfolio' : 'all';

  const theses = await getTheses({
    view: view === 'portfolio' ? 'portfolio' : 'all',
  });

  const supabase = await createClient();
  const { data: positionsData } = await supabase
    .from('positions')
    .select('thesis_id');
  const positionThesisIds = new Set(
    (positionsData ?? [])
      .map((p) => p.thesis_id)
      .filter((id): id is string => !!id),
  );

  const rows = theses.map((t) => ({
    thesis: t,
    inPortfolio: t.in_portfolio || positionThesisIds.has(t.id),
  }));

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
            Active monitoring
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
            Watch
          </h1>
        </div>
        <div
          className="mono nums"
          style={{ fontSize: 10.5, color: tokens.faint, letterSpacing: '0.08em' }}
        >
          {rows.length} ACTIVE · 0 TRIGGERS FIRED
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 24,
          marginBottom: 8,
          borderBottom: `1px solid ${tokens.line}`,
          paddingBottom: 14,
          flexWrap: 'wrap',
        }}
      >
        <FilterTab href="/watch" active={view === 'all'}>
          All
        </FilterTab>
        <FilterTab href="/watch?view=portfolio" active={view === 'portfolio'}>
          In portfolio
        </FilterTab>
        <DisabledTab>Triggers armed</DisabledTab>
        <DisabledTab>Triggers fired</DisabledTab>
        <DisabledTab>Kill-armed only</DisabledTab>
      </div>

      {rows.length === 0 ? (
        <p
          className="serif"
          style={{
            fontSize: 14,
            fontStyle: 'italic',
            color: tokens.muted,
            marginTop: 48,
            textAlign: 'center',
          }}
        >
          No theses in this view.
        </p>
      ) : (
        rows.map(({ thesis, inPortfolio }) => (
          <WatchRow key={thesis.id} thesis={thesis} inPortfolio={inPortfolio} />
        ))
      )}

      <p
        className="serif"
        style={{
          fontSize: 13,
          fontStyle: 'italic',
          color: tokens.faint,
          marginTop: 32,
          lineHeight: 1.55,
          maxWidth: '62ch',
        }}
      >
        Triggers, conviction trajectory, and directional gamma surface here when their schemas land.
        Until then, Watch is the manual roll call of the book; once Wedgetail comes online, fired
        triggers will surface as notifications and draft commands.
      </p>
    </div>
  );
}

function WatchRow({
  thesis,
  inPortfolio,
}: {
  thesis: {
    id: string;
    name: string;
    cycle_stage: string | null;
    conviction: number;
    updated_at: string;
  };
  inPortfolio: boolean;
}) {
  const conv = convictionColor(thesis.conviction);
  const cyc = cycleStageColor(thesis.cycle_stage as never);

  return (
    <Link
      href={`/library/${thesis.id}`}
      className="hairline-row btn-quiet"
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto auto',
        gap: 24,
        padding: '22px 4px',
        alignItems: 'center',
        borderBottom: `1px solid ${tokens.line}`,
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
          <h3
            className="serif"
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: tokens.text,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            {thesis.name}
          </h3>
          {inPortfolio && (
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: tokens.chime,
                boxShadow: `0 0 6px ${tokens.chime}aa`,
              }}
            />
          )}
        </div>
        <div
          style={{
            display: 'flex',
            gap: 14,
            marginBottom: 0,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          {thesis.cycle_stage && (
            <span className="label" style={{ color: cyc }}>
              {formatStage(thesis.cycle_stage).toLowerCase()}
            </span>
          )}
          <span
            className="mono"
            style={{ fontSize: 10, color: tokens.faint, letterSpacing: '0.06em' }}
          >
            UPDATED {formatShortDate(thesis.updated_at).toUpperCase()}
          </span>
          <span
            className="mono"
            style={{ fontSize: 10, color: tokens.faint, letterSpacing: '0.06em' }}
            title="Triggers schema lands in a follow-up turn"
          >
            TRIGGERS —
          </span>
        </div>
      </div>

      <div style={{ textAlign: 'right' }}>
        <div className="label" style={{ color: tokens.faint, marginBottom: 4 }}>
          Gamma
        </div>
        <GammaArrow direction={null} />
      </div>

      <div style={{ textAlign: 'right', minWidth: 80 }}>
        <div
          className="mono nums"
          style={{ fontSize: 32, fontWeight: 700, color: conv, lineHeight: 1 }}
        >
          {thesis.conviction}
        </div>
        <div
          className="mono nums"
          style={{
            fontSize: 10,
            color: tokens.faint,
            marginTop: 4,
            letterSpacing: '0.04em',
          }}
          title="Conviction delta lands when conviction history ships"
        >
          — · 3MO
        </div>
      </div>
    </Link>
  );
}

function FilterTab({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="label btn-quiet"
      style={{
        color: active ? tokens.text : tokens.muted,
        borderBottom: active ? `1px solid ${tokens.chime}` : '1px solid transparent',
        paddingBottom: 6,
        marginBottom: -15,
        textDecoration: 'none',
      }}
    >
      {children}
    </Link>
  );
}

function DisabledTab({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="label"
      title="Lights up when triggers schema ships"
      style={{
        color: tokens.faint,
        opacity: 0.5,
        paddingBottom: 6,
        marginBottom: -15,
        cursor: 'not-allowed',
      }}
    >
      {children}
    </span>
  );
}

function formatShortDate(iso: string): string {
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
