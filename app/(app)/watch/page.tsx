// Watch mode. Mockup: references/bellbird-mockup-v2-stack.jsx
//
// Turn D wires the triggers schema in. Filter tabs all live; row-expand
// shows the per-thesis trigger list. Conviction delta and gamma direction
// stay em-dashed pending item 9 (conviction history) — separate turn.

import Link from 'next/link';
import { tokens } from '@/lib/tokens';
import { createClient } from '@/lib/supabase/server';
import { getTheses } from '@/lib/supabase/queries';
import { getAllTriggers } from '@/lib/supabase/triggers-queries';
import { WatchRow } from '@/components/shared/WatchRow';
import type { Trigger } from '@/lib/types';

export const dynamic = 'force-dynamic';

type View = 'all' | 'portfolio' | 'armed' | 'fired' | 'kill';

const VIEW_VALUES: View[] = ['all', 'portfolio', 'armed', 'fired', 'kill'];

function parseView(raw: string | undefined): View {
  return (VIEW_VALUES as string[]).includes(raw ?? '') ? (raw as View) : 'all';
}

type WatchSearchParams = Promise<{ view?: string }>;

export default async function WatchPage({
  searchParams,
}: {
  searchParams: WatchSearchParams;
}) {
  const params = await searchParams;
  const view = parseView(params.view);

  // The 'portfolio' tab filters at fetch time via the existing getTheses
  // helper. Trigger-based tabs ('armed' / 'fired' / 'kill') filter after
  // we've grouped triggers by thesis.
  const baseFilter = view === 'portfolio' ? 'portfolio' : 'all';
  const theses = await getTheses({ view: baseFilter });

  const supabase = await createClient();
  const { data: positionsData } = await supabase.from('positions').select('thesis_id');
  const positionThesisIds = new Set(
    (positionsData ?? [])
      .map((p) => p.thesis_id)
      .filter((id): id is string => !!id),
  );

  const allTriggers = await getAllTriggers();
  const triggersByThesis = new Map<string, Trigger[]>();
  for (const t of allTriggers) {
    const list = triggersByThesis.get(t.thesis_id) ?? [];
    list.push(t);
    triggersByThesis.set(t.thesis_id, list);
  }

  const totalFired = allTriggers.filter((t) => t.status === 'fired').length;

  const rows = theses
    .map((t) => ({
      thesis: t,
      inPortfolio: t.in_portfolio || positionThesisIds.has(t.id),
      triggers: triggersByThesis.get(t.id) ?? [],
    }))
    .filter(({ triggers }) => {
      if (view === 'armed') return triggers.some((t) => t.status === 'armed');
      if (view === 'fired') return triggers.some((t) => t.status === 'fired');
      if (view === 'kill') {
        return triggers.some(
          (t) => t.type === 'kill-on-sight' && t.status === 'armed',
        );
      }
      return true;
    });

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
          {theses.length} ACTIVE · {totalFired}{' '}
          {totalFired === 1 ? 'TRIGGER' : 'TRIGGERS'} FIRED
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
        <FilterTab href="/watch?view=armed" active={view === 'armed'}>
          Triggers armed
        </FilterTab>
        <FilterTab href="/watch?view=fired" active={view === 'fired'}>
          Triggers fired
        </FilterTab>
        <FilterTab href="/watch?view=kill" active={view === 'kill'}>
          Kill-armed only
        </FilterTab>
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
        rows.map(({ thesis, inPortfolio, triggers }) => (
          <WatchRow
            key={thesis.id}
            thesis={{
              id: thesis.id,
              name: thesis.name,
              cycle_stage: thesis.cycle_stage,
              conviction: thesis.conviction,
              updated_at: thesis.updated_at,
            }}
            inPortfolio={inPortfolio}
            triggers={triggers}
          />
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
        Click any thesis to expand its triggers. Conviction trajectory and directional
        gamma surface here when their schemas land; once Wedgetail comes online, fired
        triggers will surface as notifications and draft commands.
      </p>
    </div>
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
