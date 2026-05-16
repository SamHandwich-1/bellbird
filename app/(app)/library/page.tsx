import { Suspense } from 'react';
import { getTheses, getPositionsForThesis } from '@/lib/supabase/queries';
import { ThesisCard } from '@/components/library/ThesisCard';
import { CycleFilter } from '@/components/library/CycleFilter';
import { ViewFilter, type ViewKey } from '@/components/library/ViewFilter';
import { NewThesisButton } from '@/components/library/NewThesisButton';
import { SeedLibraryButton } from '@/components/library/SeedLibraryButton';
import { tokens } from '@/lib/tokens';
import type { CycleStage, Thesis } from '@/lib/types';

type SearchParams = { view?: string; stage?: string };

function normaliseView(v: string | undefined): ViewKey {
  if (v === 'portfolio' || v === 'watchlist') return v;
  return 'all';
}

function normaliseStage(s: string | undefined): CycleStage | 'all' {
  const stages: CycleStage[] = [
    'secular',
    'long-cycle',
    'mid-cycle',
    'credit-cycle',
    'narrative-cycle',
  ];
  if (s && (stages as string[]).includes(s)) return s as CycleStage;
  return 'all';
}

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const view = normaliseView(params.view);
  const stage = normaliseStage(params.stage);

  const allTheses = await getTheses({});
  const total = allTheses.length;
  const filtered = applyFilters(allTheses, view, stage);

  const viewCounts = {
    all: allTheses.length,
    portfolio: allTheses.filter((t) => t.in_portfolio).length,
    watchlist: allTheses.filter((t) => !t.in_portfolio).length,
  };

  const stageCounts: Record<CycleStage | 'all', number> = {
    all: allTheses.length,
    secular: 0,
    'long-cycle': 0,
    'mid-cycle': 0,
    'credit-cycle': 0,
    'narrative-cycle': 0,
  };
  for (const t of allTheses) {
    if (t.cycle_stage) stageCounts[t.cycle_stage] += 1;
  }

  return (
    <div className="pt-12">
      <div className="flex items-baseline justify-between mb-12 flex-wrap gap-4">
        <div>
          <div
            className="font-sans text-[10px] tracking-[0.22em] uppercase mb-2"
            style={{ color: tokens.whisper }}
          >
            Library
          </div>
          <h1
            className="font-serif text-[44px] tracking-tight"
            style={{ fontWeight: 340 }}
          >
            Theses
          </h1>
          <div
            className="mt-2 font-sans text-[12px]"
            style={{ color: tokens.ash }}
          >
            <span className="font-mono">{filtered.length}</span> of{' '}
            <span className="font-mono">{total}</span> · auto-saved
          </div>
        </div>
        {total > 0 && <NewThesisButton />}
      </div>

      {total === 0 ? (
        <SeedLibraryButton />
      ) : (
        <>
          <ViewFilter counts={viewCounts} active={view} />
          <CycleFilter counts={stageCounts} active={stage} />
          <div className="hairline mb-10" />
          <Suspense fallback={null}>
            <ThesesList theses={filtered} />
          </Suspense>
        </>
      )}
    </div>
  );
}

function applyFilters(
  theses: Thesis[],
  view: ViewKey,
  stage: CycleStage | 'all',
): Thesis[] {
  return theses.filter((t) => {
    if (view === 'portfolio' && !t.in_portfolio) return false;
    if (view === 'watchlist' && t.in_portfolio) return false;
    if (stage !== 'all' && t.cycle_stage !== stage) return false;
    return true;
  });
}

async function ThesesList({ theses }: { theses: Thesis[] }) {
  const withPositions = await Promise.all(
    theses.map(async (t) => ({
      thesis: t,
      positions: await getPositionsForThesis(t.id),
    })),
  );

  return (
    <div className="space-y-12">
      {withPositions.map(({ thesis, positions }) => (
        <ThesisCard key={thesis.id} thesis={thesis} topPositions={positions} />
      ))}
    </div>
  );
}
