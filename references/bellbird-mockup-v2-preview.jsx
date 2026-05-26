import React, { useState, useEffect } from 'react';

// ============================================================================
// BELLBIRD v2 PREVIEW — Library + Developed Thesis
// Visual language adapted from bond-market-timeline and macro-cycle-bond-
// positioning. Dark editorial-analytical hybrid: high contrast, mono numbers,
// orange accent for "now / current / active", explicit gauges with track-
// gradient + current marker + historical context + read paragraph.
// ============================================================================

// ---- PALETTE ---------------------------------------------------------------
const C = {
  // Surfaces
  bg:        '#16140f',
  panel:     '#1c1914',
  panelLift: '#221e17',
  line:      '#2b2820',
  hairline:  '#3a3528',

  // Text
  text:    '#ece4d3',
  body:    '#cdc5b3',
  muted:   '#857e6d',
  faint:   '#5c5648',
  whisper: '#46413a',

  // The "now / current / live / active" accent — the bell note
  chime: '#d9803f',

  // Conviction + cycle stage (brightened for dark bg legibility)
  terracotta: '#c25234',  // low conviction / credit-cycle / alert
  amber:      '#cf9a47',  // mid conviction / mid-cycle
  sage:       '#7a9e6a',  // high conviction / secular / positive
  steel:      '#7fa8c9',  // long-cycle
  slate:      '#9a8a82',  // narrative-cycle

  // P/L
  pos: '#7a9e6a',
  neg: '#c25234',
};

const cycleColor = (s) => ({
  'secular':         C.sage,
  'long-cycle':      C.steel,
  'mid-cycle':       C.amber,
  'credit-cycle':    C.terracotta,
  'narrative-cycle': C.slate,
}[s] || C.muted);

const convictionColor = (v) => v < 40 ? C.terracotta : v < 70 ? C.amber : C.sage;
const convictionLabel = (v) => v < 40 ? 'Low' : v < 70 ? 'Moderate' : 'High';

// ---- MOCK DATA -------------------------------------------------------------
const mockTheses = [
  { id: 'grid', name: 'Grid Resilience', sector: 'Industrials × Utilities',
    cycleStage: 'secular', conviction: 80, inPortfolio: true,
    summary: 'Grid hardware names trade at industrial multiples while their cash flows are utility-derivative.',
    positions: ['PWR','ETN','PRYMF','SHLS','ENS'] },
  { id: 'credit', name: 'Private Credit — Slow Burn', sector: 'Financials × Credit Cycle',
    cycleStage: 'credit-cycle', conviction: 78, inPortfolio: false,
    summary: 'The damage isn\'t a Lehman cascade — it\'s retail-facing semi-liquid wrappers gating redemptions.',
    positions: ['BX','OWL','ARCC'] },
  { id: 'japan', name: 'Japan Megabank ROE Repricing', sector: 'Financials × Japan',
    cycleStage: 'mid-cycle', conviction: 73, inPortfolio: false,
    summary: 'Japanese megabank ROEs structurally repricing for the first time since the 1990s.',
    positions: ['MUFG','SMFG','MFG'] },
  { id: 'silver', name: 'Silver Over Gold', sector: 'Commodities × Monetary',
    cycleStage: 'long-cycle', conviction: 76, inPortfolio: true,
    summary: 'Silver deficit narrative assumes inelastic industrial demand. It isn\'t — but the monetary leg is real.',
    positions: ['SIVR','PAAS','WPM'] },
  { id: 'solana', name: 'Solana — Agent Economy Settlement', sector: 'Crypto × AI Infrastructure',
    cycleStage: 'secular', conviction: 60, inPortfolio: true,
    summary: 'Agent-to-agent payments need a low-cost settlement layer. The sub-economy is already running on Solana.',
    positions: ['BSOL','FORD','FSOL'] },
  { id: 'agentequity', name: 'Agent Economy — Equity Layer', sector: 'Software × AI',
    cycleStage: 'secular', conviction: 63, inPortfolio: false,
    summary: 'Equity-side companion to Solana settlement: who collects the rails-and-rent toll on the agent economy.',
    positions: ['NET','V','OKTA','MA','PYPL','SHOP'] },
  { id: 'insurance', name: 'Insurance — AI Eats Labor Cost', sector: 'Financials × AI',
    cycleStage: 'mid-cycle', conviction: 68, inPortfolio: false,
    summary: 'Combined-ratio compression as underwriting and claims operations move to AI. Re-rate, not just earnings beat.',
    positions: ['CB','TRV','ALL'] },
  { id: 'aaa', name: 'AAA Collapse / Platform Compound', sector: 'Entertainment × Platform',
    cycleStage: 'narrative-cycle', conviction: 65, inPortfolio: true,
    summary: 'UGC-eats-AAA at the entertainment layer. RBLX, ROBX, and platform compounding kill traditional studio economics.',
    positions: ['RBLX','TTWO','EA'] },
];

// Full detail for the worked example
const detailedThesis = {
  id: 'grid',
  name: 'Grid Resilience',
  sector: 'Industrials × Utilities',
  cycleStage: 'secular',
  conviction: 80,
  convictionPrior: 72,           // for the "moved from" tick
  directionalGamma: 'rising',     // probability moving toward thesis
  inPortfolio: true,
  established: '2026-02-14',
  summary: `Grid hardware names trade at industrial multiples while their cash flows are utility-derivative. The mismatch persists because the market sorts companies by GICS sector and these sit in industrials, but the demand backdrop — load growth from AI data centres, electrification, retirements of baseload — locks in decade-plus capex cycles for utilities, which means decade-plus order books for the hardware. Multiple expansion follows when allocators recognise the cash-flow character, not the sector tag.`,
  hedgeNotes: `Risk: hyperscaler capex collapse compresses the multiple before utility capex picks up the slack. Hedge: short hyperscaler-leveraged EPC names against the long, or use IDU calls for portfolio convexity if equity dispersion widens.`,
  positions: [
    { ticker: 'PWR',   name: 'Quanta Services',           weight: 4.2, entry: 312.40, current: 348.10, note: 'Largest position. EPC labor + grid hardware. Order book extending beyond 2030.' },
    { ticker: 'ETN',   name: 'Eaton',                      weight: 3.4, entry: 358.20, current: 376.50, note: 'Electrical distribution and power management. Data centre exposure but diversified.' },
    { ticker: 'PRYMF', name: 'Prysmian',                   weight: 2.8, entry: 49.10,  current: 56.30,  note: 'HVDC cables — the bottleneck for offshore wind and long-distance transmission.' },
    { ticker: 'SHLS',  name: 'Shoals Technologies',        weight: 2.1, entry: 6.40,   current: 5.85,   note: 'Underperformer. Watching Q3 backlog conversion before adding.' },
    { ticker: 'ENS',   name: 'EnerSys',                    weight: 1.9, entry: 92.80,  current: 104.40, note: 'Industrial battery / storage. Smaller position; awaiting Lithium-ion segment scale.' },
  ],
};

// ---- TYPOGRAPHY ------------------------------------------------------------
const FONT_STYLES = `
  .serif { font-family: 'Fraunces', Georgia, serif; font-feature-settings: 'ss01'; }
  .sans  { font-family: 'Manrope', system-ui, sans-serif; }
  .mono  { font-family: 'JetBrains Mono', ui-monospace, monospace; }
  .nums  { font-variant-numeric: tabular-nums; }
  .label { font-family: 'JetBrains Mono', ui-monospace, monospace; text-transform: uppercase; letter-spacing: 0.16em; font-size: 9.5px; }
  .hairline-row { transition: background 200ms ease; }
  .hairline-row:hover { background: ${C.panel}; cursor: pointer; }
`;

// ============================================================================
// APP CONTAINER
// ============================================================================
export default function BellbirdMockupV2Preview() {
  const [view, setView] = useState('library');

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=JetBrains+Mono:wght@400;500;600;700&family=Manrope:wght@300;400;500;600&display=swap';
    document.head.appendChild(link);
    return () => { try { document.head.removeChild(link); } catch {} };
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text }}>
      <style>{FONT_STYLES}</style>
      <TopBar view={view} onChangeView={setView} />
      <main style={{ maxWidth: 920, margin: '0 auto', padding: '0 32px 96px' }}>
        {view === 'library' ? (
          <LibraryPage onOpen={() => setView('detail')} />
        ) : (
          <ThesisDetailPage onBack={() => setView('library')} />
        )}
      </main>
    </div>
  );
}

// ============================================================================
// TOP BAR
// ============================================================================
function TopBar({ view, onChangeView }) {
  const modes = ['identity','library','develop','watch','portfolio','cycles'];
  return (
    <div style={{ borderBottom: `1px solid ${C.line}`, marginBottom: 56 }}>
      <div style={{
        maxWidth: 920, margin: '0 auto', padding: '20px 32px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24,
      }}>
        <div className="serif" style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em', color: C.text }}>
          Bellbird
        </div>
        <div style={{ display: 'flex', gap: 22 }}>
          {modes.map(m => {
            const active = (m === 'library' && view === 'library') || (m === 'library' && view === 'detail');
            return (
              <div key={m} className="label" style={{
                color: active ? C.chime : C.faint,
                cursor: 'default',
                paddingBottom: 2,
                borderBottom: active ? `1px solid ${C.chime}` : '1px solid transparent',
              }}>
                {m}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// LIBRARY PAGE
// ============================================================================
function LibraryPage({ onOpen }) {
  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 36, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="label" style={{ color: C.muted, marginBottom: 6 }}>Thesis library</div>
          <h1 className="serif" style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-0.02em', color: C.text, margin: 0, lineHeight: 1.1 }}>
            The book
          </h1>
        </div>
        <div className="mono nums" style={{ fontSize: 11, color: C.faint, letterSpacing: '0.06em' }}>
          {mockTheses.length} ACTIVE · 0 ARCHIVED
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 8, borderBottom: `1px solid ${C.line}`, paddingBottom: 14 }}>
        {['All','Secular','Long-cycle','Mid-cycle','Credit-cycle','Narrative-cycle'].map((f,i) => (
          <div key={f} className="label" style={{
            color: i === 0 ? C.text : C.muted,
            borderBottom: i === 0 ? `1px solid ${C.chime}` : '1px solid transparent',
            paddingBottom: 6, marginBottom: -15, cursor: 'default',
          }}>
            {f}
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <div className="label" style={{ color: C.faint, cursor: 'default' }}>Sort · Conviction</div>
      </div>

      {/* Thesis list */}
      <div>
        {mockTheses.map((t, i) => (
          <ThesisRow key={t.id} t={t} onClick={t.id === 'grid' ? onOpen : undefined} />
        ))}
      </div>

      {/* Footer hint */}
      <div className="serif" style={{ fontSize: 13, fontStyle: 'italic', color: C.faint, marginTop: 48, textAlign: 'center', lineHeight: 1.5 }}>
        Click the Grid Resilience row to see the developed-thesis layout.
      </div>
    </div>
  );
}

function ThesisRow({ t, onClick }) {
  const conv = convictionColor(t.conviction);
  const cyc = cycleColor(t.cycleStage);
  return (
    <div
      onClick={onClick}
      className="hairline-row"
      style={{
        borderBottom: `1px solid ${C.line}`,
        padding: '24px 0',
        cursor: onClick ? 'pointer' : 'default',
        display: 'grid',
        gridTemplateColumns: '1fr 88px',
        gap: 32,
        alignItems: 'baseline',
      }}
    >
      <div style={{ minWidth: 0 }}>
        {/* Name + portfolio dot */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
          <h3 className="serif" style={{ fontSize: 21, fontWeight: 600, color: C.text, margin: 0, letterSpacing: '-0.01em' }}>
            {t.name}
          </h3>
          {t.inPortfolio && (
            <span style={{
              width: 6, height: 6, borderRadius: '50%', background: C.chime,
              boxShadow: `0 0 6px ${C.chime}aa`, display: 'inline-block',
            }} title="In portfolio" />
          )}
        </div>

        {/* Meta row */}
        <div style={{ display: 'flex', gap: 18, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="mono" style={{ fontSize: 10.5, color: C.muted, letterSpacing: '0.04em' }}>
            {t.sector}
          </span>
          <span className="label" style={{ color: cyc }}>
            {t.cycleStage.replace('-', ' ')}
          </span>
          {t.inPortfolio && (
            <span className="label" style={{ color: C.chime }}>In portfolio</span>
          )}
        </div>

        {/* Summary */}
        <p className="serif" style={{ fontSize: 14.5, lineHeight: 1.55, color: C.body, margin: '0 0 10px', maxWidth: '60ch' }}>
          {t.summary}
        </p>

        {/* Positions */}
        <div className="mono nums" style={{ fontSize: 10.5, color: C.faint, letterSpacing: '0.08em' }}>
          {t.positions.join('  ·  ')}
        </div>
      </div>

      {/* Conviction number */}
      <div style={{ textAlign: 'right' }}>
        <div className="mono nums" style={{
          fontSize: 32, fontWeight: 700, color: conv, lineHeight: 1,
        }}>
          {t.conviction}
        </div>
        <div className="label" style={{ color: C.faint, marginTop: 6 }}>
          Conviction
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// DEVELOPED THESIS PAGE
// ============================================================================
function ThesisDetailPage({ onBack }) {
  const t = detailedThesis;
  const conv = convictionColor(t.conviction);
  const cyc = cycleColor(t.cycleStage);

  return (
    <div>
      {/* Back link */}
      <div
        onClick={onBack}
        className="label"
        style={{ color: C.muted, marginBottom: 32, cursor: 'pointer', display: 'inline-block' }}
      >
        ← Library
      </div>

      {/* Header: name + meta + conviction */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 32, alignItems: 'start', marginBottom: 32 }}>
        <div>
          <div className="label" style={{ color: C.muted, marginBottom: 8 }}>
            Thesis · Established 14 Feb 2026
          </div>
          <h1 className="serif" style={{
            fontSize: 40, fontWeight: 600, letterSpacing: '-0.02em',
            color: C.text, margin: 0, lineHeight: 1.05,
          }}>
            {t.name}
          </h1>
          <div style={{ display: 'flex', gap: 20, marginTop: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="mono" style={{ fontSize: 11, color: C.muted, letterSpacing: '0.04em' }}>
              {t.sector}
            </span>
            <span className="label" style={{ color: cyc }}>
              {t.cycleStage.replace('-',' ')}
            </span>
            {t.inPortfolio && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.chime, boxShadow: `0 0 6px ${C.chime}aa` }} />
                <span className="label" style={{ color: C.chime }}>In portfolio</span>
              </span>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="mono nums" style={{ fontSize: 56, fontWeight: 700, color: conv, lineHeight: 1 }}>
            {t.conviction}
          </div>
          <div className="label" style={{ color: C.faint, marginTop: 8 }}>
            {convictionLabel(t.conviction)} conviction
          </div>
        </div>
      </div>

      {/* Conviction gauge — the bond Gauge pattern adapted */}
      <ConvictionGauge thesis={t} />

      {/* The thesis */}
      <Section label="The thesis">
        <p className="serif" style={{ fontSize: 16, lineHeight: 1.65, color: C.body, margin: 0 }}>
          {t.summary}
        </p>
      </Section>

      {/* Positions */}
      <Section label="Positions" right={`${t.positions.length} holdings`}>
        <PositionsTable positions={t.positions} />
      </Section>

      {/* Hedge notes */}
      <Section label="Risk & hedge notes">
        <p className="serif" style={{ fontSize: 14.5, lineHeight: 1.6, color: C.body, margin: 0 }}>
          {t.hedgeNotes}
        </p>
      </Section>

      {/* Planned feature placeholders — to test the language holds */}
      <PlannedSection
        label="Triggers"
        sub="Per-thesis invalidation conditions — confirming, disconfirming, kill-on-sight, action"
      />
      <PlannedSection
        label="Conviction history"
        sub="Timestamped trajectory of conviction changes, each linked to the discussion that produced it"
      />
      <PlannedSection
        label="Discussion log"
        sub="Original thesis-generation transcript + each subsequent ingestion event as its own artifact"
      />
    </div>
  );
}

// ============================================================================
// CONVICTION GAUGE — adapted from bond macro-cycle Gauge
// ============================================================================
function ConvictionGauge({ thesis }) {
  const v = thesis.conviction;
  const prior = thesis.convictionPrior;
  const curP = v;        // 0–100 scale = direct percentage
  const priorP = prior;

  return (
    <div style={{ margin: '8px 0 48px', padding: '24px 0 28px', borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 36, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div className="label" style={{ color: C.muted, marginBottom: 4 }}>
            Conviction · 0–100 scale
          </div>
          <div className="serif" style={{ fontSize: 13, fontStyle: 'italic', color: C.faint }}>
            Moved from {prior} on 14 May 2026 · Directional gamma: <span style={{ color: C.sage }}>rising</span>
          </div>
        </div>
        <div className="mono" style={{ fontSize: 10, color: C.faint, letterSpacing: '0.06em' }}>
          LAST UPDATED · 22 MAY 2026
        </div>
      </div>

      {/* Track */}
      <div style={{ position: 'relative', height: 14, margin: '0 0 8px' }}>
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 2,
          background: `linear-gradient(90deg, ${C.terracotta} 0%, ${C.terracotta} 38%, ${C.amber} 42%, ${C.amber} 68%, ${C.sage} 72%, ${C.sage} 100%)`,
          opacity: 0.85,
        }} />

        {/* Prior conviction tick */}
        <div style={{
          position: 'absolute', left: `${priorP}%`, top: -6, bottom: -6,
          width: 1, background: C.body, opacity: 0.45,
        }}>
          <div className="mono" style={{
            position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)',
            whiteSpace: 'nowrap', fontSize: 8.5, color: C.muted, letterSpacing: '0.04em',
          }}>
            PRIOR {prior}
          </div>
        </div>

        {/* Current marker */}
        <div style={{
          position: 'absolute', left: `${curP}%`, top: -11, bottom: -11,
          width: 2.5, background: C.chime,
          boxShadow: `0 0 10px ${C.chime}aa`, transform: 'translateX(-50%)',
        }}>
          <div style={{
            position: 'absolute', top: -8, left: '50%',
            transform: 'translateX(-50%) rotate(45deg)',
            width: 9, height: 9, background: C.chime,
          }} />
        </div>
      </div>

      {/* Scale labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}>
        <span className="mono" style={{ fontSize: 9.5, color: C.faint, letterSpacing: '0.06em' }}>0  ·  REJECT</span>
        <span className="mono" style={{ fontSize: 9.5, color: C.faint, letterSpacing: '0.06em' }}>40  ·  LOW</span>
        <span className="mono" style={{ fontSize: 9.5, color: C.faint, letterSpacing: '0.06em' }}>70  ·  HIGH</span>
        <span className="mono" style={{ fontSize: 9.5, color: C.faint, letterSpacing: '0.06em' }}>100  ·  MAX</span>
      </div>

      {/* Read */}
      <p className="serif" style={{
        fontSize: 13.5, fontStyle: 'italic', lineHeight: 1.55,
        color: C.muted, margin: '20px 0 0', maxWidth: '60ch',
      }}>
        High conviction with positive gamma — three months of confirming data (utility capex guidance,
        EPC backlog extension, Eaton order book) have moved the read from <span style={{ color: C.body }}>72 → 80</span>.
        Watch for the first signs of hyperscaler capex deceleration; that's the primary disconfirming signal.
      </p>
    </div>
  );
}

// ============================================================================
// REUSABLE SECTION + POSITIONS
// ============================================================================
function Section({ label, right, children }) {
  return (
    <div style={{ marginBottom: 48 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16, paddingBottom: 10, borderBottom: `1px solid ${C.line}` }}>
        <div className="label" style={{ color: C.text }}>{label}</div>
        {right && <div className="mono" style={{ fontSize: 10, color: C.faint, letterSpacing: '0.06em' }}>{right.toUpperCase()}</div>}
      </div>
      {children}
    </div>
  );
}

function PositionsTable({ positions }) {
  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '64px 1fr 64px 80px 80px 70px',
        gap: 16, padding: '10px 0', borderBottom: `1px solid ${C.line}`,
      }}>
        <div className="label" style={{ color: C.faint }}>Ticker</div>
        <div className="label" style={{ color: C.faint }}>Name</div>
        <div className="label" style={{ color: C.faint, textAlign: 'right' }}>Weight</div>
        <div className="label" style={{ color: C.faint, textAlign: 'right' }}>Entry</div>
        <div className="label" style={{ color: C.faint, textAlign: 'right' }}>Current</div>
        <div className="label" style={{ color: C.faint, textAlign: 'right' }}>P/L</div>
      </div>
      {positions.map((p, i) => <PositionRow key={i} p={p} />)}
    </div>
  );
}

function PositionRow({ p }) {
  const [open, setOpen] = useState(false);
  const pl = ((p.current - p.entry) / p.entry) * 100;
  const positive = pl >= 0;
  return (
    <div style={{ borderBottom: `1px solid ${C.line}` }}>
      <div
        onClick={() => setOpen(!open)}
        className="hairline-row"
        style={{
          display: 'grid',
          gridTemplateColumns: '64px 1fr 64px 80px 80px 70px',
          gap: 16, padding: '14px 0', alignItems: 'baseline', cursor: 'pointer',
        }}
      >
        <div className="mono" style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{p.ticker}</div>
        <div className="sans" style={{ fontSize: 13, color: C.body }}>{p.name}</div>
        <div className="mono nums" style={{ fontSize: 12.5, textAlign: 'right', color: C.text }}>{p.weight}%</div>
        <div className="mono nums" style={{ fontSize: 12.5, textAlign: 'right', color: C.muted }}>${p.entry.toFixed(2)}</div>
        <div className="mono nums" style={{ fontSize: 12.5, textAlign: 'right', color: C.text }}>${p.current.toFixed(2)}</div>
        <div className="mono nums" style={{
          fontSize: 13, fontWeight: 600, textAlign: 'right',
          color: positive ? C.pos : C.neg,
        }}>
          {positive ? '+' : ''}{pl.toFixed(1)}%
        </div>
      </div>
      {open && (
        <div style={{ padding: '0 0 16px 0' }}>
          <p className="serif" style={{ fontSize: 13.5, fontStyle: 'italic', lineHeight: 1.55, color: C.muted, margin: 0, maxWidth: '60ch' }}>
            {p.note}
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// PLANNED SECTION (placeholder for triggers / history / discussion)
// ============================================================================
function PlannedSection({ label, sub }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12, paddingBottom: 10, borderBottom: `1px solid ${C.line}` }}>
        <div className="label" style={{ color: C.faint }}>{label}</div>
        <div className="mono" style={{ fontSize: 9.5, color: C.chime, letterSpacing: '0.12em' }}>PLANNED</div>
      </div>
      <p className="serif" style={{ fontSize: 13.5, fontStyle: 'italic', color: C.faint, margin: 0, lineHeight: 1.55 }}>
        {sub}
      </p>
    </div>
  );
}
