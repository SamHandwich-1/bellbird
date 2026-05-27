import Link from 'next/link';
import { tokens } from '@/lib/tokens';
import { createClient } from '@/lib/supabase/server';
import { getTheses } from '@/lib/supabase/queries';
import { ThesisRow } from '@/components/shared/ThesisRow';
import type { CycleStage, Position } from '@/lib/types';

export const dynamic = 'force-dynamic';

const STAGE_FILTERS: Array<{ key: 'all' | CycleStage; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'secular', label: 'Secular' },
  { key: 'long-cycle', label: 'Long-cycle' },
  { key: 'mid-cycle', label: 'Mid-cycle' },
  { key: 'credit-cycle', label: 'Credit-cycle' },
  { key: 'narrative-cycle', label: 'Narrative-cycle' },
];

type SearchParams = Promise<{ stage?: string; sort?: string }>;

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const stage = (STAGE_FILTERS.find((s) => s.key === params.stage)?.key ?? 'all') as
    | 'all'
    | CycleStage;
  const sort = params.sort === 'name' ? 'name' : 'conviction';

  const theses = await getTheses({ stage });
  const sorted = [...theses].sort((a, b) =>
    sort === 'name'
      ? a.name.localeCompare(b.name)
      : b.conviction - a.conviction,
  );

  const tickersByThesis = await fetchPositionTickers(sorted.map((t) => t.id));
  const total = theses.length;

  return (
    <div>
      <div
        style={{
          marginBottom: 36,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <div className="label" style={{ color: tokens.muted, marginBottom: 6 }}>
            Thesis library
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
            The book
          </h1>
        </div>
        <div
          className="mono nums"
          style={{ fontSize: 11, color: tokens.faint, letterSpacing: '0.06em' }}
        >
          {total} ACTIVE
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
        {STAGE_FILTERS.map((f) => {
          const active = f.key === stage;
          const href = f.key === 'all' ? '/library' : `/library?stage=${f.key}`;
          return (
            <Link
              key={f.key}
              href={href}
              className="label btn-quiet"
              style={{
                color: active ? tokens.text : tokens.muted,
                borderBottom: active
                  ? `1px solid ${tokens.chime}`
                  : '1px solid transparent',
                paddingBottom: 6,
                marginBottom: -15,
                textDecoration: 'none',
              }}
            >
              {f.label}
            </Link>
          );
        })}
        <div style={{ flex: 1 }} />
        <Link
          href={
            sort === 'conviction'
              ? `/library?${stage === 'all' ? '' : `stage=${stage}&`}sort=name`
              : `/library?${stage === 'all' ? '' : `stage=${stage}`}`
          }
          className="label btn-quiet"
          style={{ color: tokens.faint, textDecoration: 'none' }}
        >
          Sort · {sort === 'conviction' ? 'Conviction' : 'Name'}
        </Link>
      </div>

      {sorted.length === 0 ? (
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
          No theses in this view. Try the All filter or start a new conversation in Develop.
        </p>
      ) : (
        <div>
          {sorted.map((t) => (
            <ThesisRow
              key={t.id}
              thesis={t}
              positions={tickersByThesis[t.id] ?? []}
            />
          ))}
        </div>
      )}
    </div>
  );
}

async function fetchPositionTickers(thesisIds: string[]): Promise<Record<string, string[]>> {
  if (thesisIds.length === 0) return {};
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('positions')
    .select('thesis_id, ticker, position_order')
    .in('thesis_id', thesisIds)
    .order('position_order', { ascending: true, nullsFirst: false });
  if (error || !data) return {};

  const map: Record<string, string[]> = {};
  for (const row of data as Pick<Position, 'thesis_id' | 'ticker'>[]) {
    if (!row.thesis_id) continue;
    if (!map[row.thesis_id]) map[row.thesis_id] = [];
    if (map[row.thesis_id].length < 5) map[row.thesis_id].push(row.ticker);
  }
  return map;
}
