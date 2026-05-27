import { tokens, cycleStageColor, convictionColor } from '@/lib/tokens';
import {
  getTrades,
  getCurrentPrices,
  getThesesForPortfolio,
} from '@/lib/supabase/portfolio-queries';
import { getTheses, getPositionsForThesis } from '@/lib/supabase/queries';
import { aggregateHoldings } from '@/lib/portfolio/aggregate';
import { Section } from '@/components/shared/Section';
import { AllocationBar } from '@/components/shared/AllocationBar';
import { NewTradeButton } from '@/components/shared/NewTradeButton';
import { HoldingRow, HoldingsHeader } from '@/components/shared/HoldingRow';
import { TradeRowActions } from '@/components/shared/TradeRowActions';
import type { CycleStage, Position, Thesis, Trade } from '@/lib/types';

export const dynamic = 'force-dynamic';

type TargetSlice = {
  id: string;
  name: string;
  cycle_stage: CycleStage | null;
  conviction: number;
  weight: number;
  positions: Position[];
};

export default async function PortfolioPage() {
  const [theses, trades, prices, thesesForModal] = await Promise.all([
    getTheses({}),
    getTrades(),
    getCurrentPrices(),
    getThesesForPortfolio(),
  ]);

  const positionsByThesis = await loadPositionsByThesis(theses);
  const targetSlices: TargetSlice[] = theses
    .map((t) => {
      const positions = positionsByThesis[t.id] ?? [];
      const weight = positions
        .filter((p) => p.side === 'long')
        .reduce((s, p) => s + p.weight, 0);
      return {
        id: t.id,
        name: t.name,
        cycle_stage: t.cycle_stage,
        conviction: t.conviction,
        weight,
        positions,
      };
    })
    .filter((s) => s.weight > 0)
    .sort((a, b) => b.weight - a.weight);

  const totalAllocated = Math.round(
    targetSlices.reduce((s, t) => s + t.weight, 0),
  );
  const cash = Math.max(0, 100 - totalAllocated);

  const holdings = aggregateHoldings(trades, prices);
  const openHoldings = holdings.filter((h) => h.net_quantity > 0);
  const thesisNameById = new Map(theses.map((t) => [t.id, t.name]));

  return (
    <div>
      <div
        style={{
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <div className="label" style={{ color: tokens.muted, marginBottom: 6 }}>
            Target allocation · ideation, not live state
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
            Portfolio
          </h1>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 16,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <span
            className="mono nums"
            style={{ fontSize: 11, color: tokens.faint, letterSpacing: '0.06em' }}
          >
            {targetSlices.length} THESES · {totalAllocated}% ALLOCATED · {cash}% CASH
          </span>
          <NewTradeButton theses={thesesForModal} />
        </div>
      </div>

      <p
        className="serif"
        style={{
          fontSize: 13.5,
          fontStyle: 'italic',
          color: tokens.muted,
          marginBottom: 36,
          lineHeight: 1.55,
          maxWidth: '62ch',
        }}
      >
        These are target weights — how the book should be sized if conviction translated cleanly to NAV.
        Live execution and rebalancing belong to Wedgetail.
      </p>

      <div
        style={{
          display: 'flex',
          gap: 24,
          marginBottom: 24,
          paddingBottom: 14,
          borderBottom: `1px solid ${tokens.line}`,
        }}
      >
        <span
          className="label"
          style={{
            color: tokens.chime,
            borderBottom: `1px solid ${tokens.chime}`,
            paddingBottom: 6,
            marginBottom: -15,
          }}
        >
          By thesis
        </span>
        <DisabledTab>By sector</DisabledTab>
        <DisabledTab>By cycle stage</DisabledTab>
      </div>

      <Section label="Allocation · by thesis" right={`${totalAllocated}% deployed`}>
        {targetSlices.length === 0 ? (
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
            No target positions defined yet. Library theses with long positions surface here.
          </p>
        ) : (
          <>
            <AllocationBar
              slices={targetSlices.map((s) => ({
                id: s.id,
                name: s.name,
                weight: s.weight,
                cycle_stage: s.cycle_stage,
              }))}
              cashPct={cash}
            />
            <div style={{ marginTop: 28 }}>
              {targetSlices.map((t) => (
                <AllocationRow key={t.id} t={t} />
              ))}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: 24,
                  padding: '14px 0',
                  borderBottom: `1px solid ${tokens.line}`,
                  alignItems: 'baseline',
                }}
              >
                <span
                  className="serif"
                  style={{ fontSize: 14, color: tokens.muted, fontStyle: 'italic' }}
                >
                  Cash + opportunistic
                </span>
                <span
                  className="mono nums"
                  style={{ fontSize: 16, color: tokens.muted, fontWeight: 600 }}
                >
                  {cash}%
                </span>
              </div>
            </div>
          </>
        )}
      </Section>

      {targetSlices.length > 0 && (
        <Section label="Positions · grouped by thesis">
          {targetSlices.map((t) => (
            <ThesisPositionsBlock key={t.id} t={t} />
          ))}
        </Section>
      )}

      <Section
        label="Holdings · actual"
        right={`${openHoldings.length} open · derived from trades`}
      >
        {openHoldings.length === 0 ? (
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
            No open positions. Enter a trade to populate the book.
          </p>
        ) : (
          <>
            <HoldingsHeader />
            {openHoldings.map((h) => (
              <HoldingRow
                key={h.ticker}
                holding={h}
                thesisName={
                  h.thesis_id ? thesisNameById.get(h.thesis_id) ?? null : null
                }
              />
            ))}
          </>
        )}
      </Section>

      <Section label="Trade history" right={`${trades.length} trades`}>
        {trades.length === 0 ? (
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
            No trades yet.
          </p>
        ) : (
          <TradeHistory
            trades={trades}
            theses={thesesForModal}
            thesisNameById={thesisNameById}
          />
        )}
      </Section>
    </div>
  );
}

function AllocationRow({ t }: { t: TargetSlice }) {
  const cyc = cycleStageColor(t.cycle_stage);
  const conv = convictionColor(t.conviction);
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '12px 1fr auto auto',
        gap: 16,
        padding: '12px 0',
        borderBottom: `1px solid ${tokens.line}`,
        alignItems: 'baseline',
      }}
    >
      <div style={{ width: 8, height: 8, background: cyc, alignSelf: 'center' }} />
      <span className="serif" style={{ fontSize: 14.5, color: tokens.body }}>
        {t.name}
      </span>
      <span
        className="mono nums"
        style={{ fontSize: 10, color: conv, letterSpacing: '0.06em' }}
      >
        {t.conviction} CONV
      </span>
      <span
        className="mono nums"
        style={{
          fontSize: 14,
          color: tokens.text,
          fontWeight: 600,
          textAlign: 'right',
          minWidth: 44,
        }}
      >
        {t.weight.toFixed(1)}%
      </span>
    </div>
  );
}

function ThesisPositionsBlock({ t }: { t: TargetSlice }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 10,
          paddingBottom: 8,
          borderBottom: `1px solid ${tokens.line}`,
        }}
      >
        <span className="serif" style={{ fontSize: 16, fontWeight: 600, color: tokens.text }}>
          {t.name}
        </span>
        <span
          className="mono nums"
          style={{ fontSize: 11, color: tokens.muted, letterSpacing: '0.04em' }}
        >
          {t.weight.toFixed(1)}% OF NAV
        </span>
      </div>
      {t.positions
        .filter((p) => p.side === 'long')
        .map((p) => (
          <div
            key={p.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '60px 1fr auto',
              gap: 16,
              padding: '8px 0',
              borderBottom: `1px solid ${tokens.line}`,
              alignItems: 'baseline',
            }}
          >
            <span className="mono" style={{ fontSize: 12.5, fontWeight: 600, color: tokens.text }}>
              {p.ticker}
            </span>
            <span className="sans" style={{ fontSize: 12, color: tokens.muted }}>
              {p.name}
            </span>
            <span className="mono nums" style={{ fontSize: 12, color: tokens.text }}>
              {p.weight}%
            </span>
          </div>
        ))}
    </div>
  );
}

function TradeHistory({
  trades,
  theses,
  thesisNameById,
}: {
  trades: Trade[];
  theses: Pick<Thesis, 'id' | 'name'>[];
  thesisNameById: Map<string, string>;
}) {
  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '92px 70px 1fr 80px 70px 90px 88px 80px',
          gap: 12,
          padding: '10px 0',
          borderBottom: `1px solid ${tokens.line}`,
        }}
      >
        <span className="label" style={{ color: tokens.faint }}>
          Date
        </span>
        <span className="label" style={{ color: tokens.faint }}>
          Ticker
        </span>
        <span className="label" style={{ color: tokens.faint }}>
          Thesis
        </span>
        <span className="label" style={{ color: tokens.faint }}>
          Side
        </span>
        <span className="label" style={{ color: tokens.faint, textAlign: 'right' }}>
          Qty
        </span>
        <span className="label" style={{ color: tokens.faint, textAlign: 'right' }}>
          Price
        </span>
        <span className="label" style={{ color: tokens.faint, textAlign: 'right' }}>
          Total
        </span>
        <span className="label" style={{ color: tokens.faint, textAlign: 'right' }}>
          Actions
        </span>
      </div>
      {trades.map((t) => (
        <div
          key={t.id}
          style={{
            display: 'grid',
            gridTemplateColumns: '92px 70px 1fr 80px 70px 90px 88px 80px',
            gap: 12,
            padding: '12px 0',
            borderBottom: `1px solid ${tokens.line}`,
            alignItems: 'baseline',
          }}
          className="hairline-row"
        >
          <span
            className="mono nums"
            style={{ fontSize: 11.5, color: tokens.body, letterSpacing: '0.02em' }}
          >
            {formatDate(t.executed_at)}
          </span>
          <span className="mono" style={{ fontSize: 12.5, fontWeight: 600, color: tokens.text }}>
            {t.ticker}
          </span>
          <span
            className="sans"
            style={{
              fontSize: 11,
              color: tokens.muted,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {t.thesis_id ? thesisNameById.get(t.thesis_id) ?? '—' : '—'}
          </span>
          <span
            className="label"
            style={{ color: t.side === 'buy' ? tokens.sage : tokens.terracotta }}
          >
            {t.side}
          </span>
          <span
            className="mono nums"
            style={{ fontSize: 12, textAlign: 'right', color: tokens.text }}
          >
            {t.quantity}
          </span>
          <span
            className="mono nums"
            style={{ fontSize: 12, textAlign: 'right', color: tokens.body }}
          >
            ${t.price.toFixed(2)}
          </span>
          <span
            className="mono nums"
            style={{ fontSize: 12, textAlign: 'right', color: tokens.text }}
          >
            ${(t.quantity * t.price + (t.fees ?? 0)).toFixed(2)}
          </span>
          <TradeRowActions trade={t} theses={theses} />
        </div>
      ))}
    </div>
  );
}

function DisabledTab({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="label"
      title="Lights up when by-sector and by-cycle views ship"
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

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-AU', {
      day: '2-digit',
      month: 'short',
      year: '2-digit',
    });
  } catch {
    return iso;
  }
}

async function loadPositionsByThesis(
  theses: Thesis[],
): Promise<Record<string, Position[]>> {
  const entries = await Promise.all(
    theses.map(async (t) => [t.id, await getPositionsForThesis(t.id)] as const),
  );
  return Object.fromEntries(entries);
}
