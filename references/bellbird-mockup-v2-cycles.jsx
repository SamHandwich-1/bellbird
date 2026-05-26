import React, { useEffect } from 'react';

// ============================================================================
// BELLBIRD v2 PREVIEW — Cycles page
// Multi-gauge macro dashboard. Builds on the design system established in
// bellbird-mockup-v2-preview.jsx (Library + Developed Thesis).
//
// New patterns introduced here:
//   - CycleGauge: slimmer variant of the conviction gauge, sized for stacking
//   - ConvergenceMap: single-track map showing all cycle phases at once
//   - PhaseTag: phase label coloured by phase
//   - AnalogRow: historical-parallel summary row
// ============================================================================

// ---- PALETTE (matches v2-preview) ------------------------------------------
const C = {
  bg:        '#16140f',
  panel:     '#1c1914',
  panelLift: '#221e17',
  line:      '#2b2820',
  hairline:  '#3a3528',

  text:    '#ece4d3',
  body:    '#cdc5b3',
  muted:   '#857e6d',
  faint:   '#5c5648',
  whisper: '#46413a',

  chime: '#d9803f',

  // Cycle phase palette (cool → warm → hot)
  trough:     '#7fa8c9',  // steel  — trough / recovery
  expansion:  '#7a9e6a',  // sage   — expansion / healthy
  peak:       '#cf9a47',  // amber  — peak / late / ripe
  contraction:'#c25234',  // terra  — contraction / correction / damage
  bifurcated: '#9a8a82',  // slate  — indeterminate / bifurcated
};

// Maps a 0–100 cycle reading to its current phase colour
const phaseColor = (v, override) => {
  if (override === 'bifurcated') return C.bifurcated;
  if (v < 22)  return C.trough;
  if (v < 52)  return C.expansion;
  if (v < 75)  return C.peak;
  return C.contraction;
};

// ---- MOCK DATA -------------------------------------------------------------
const cycles = [
  {
    id: 'market',
    name: 'Market cycle',
    phase: 'Late expansion',
    current: 78,
    prior: 65,
    priorDate: 'Q4 2024',
    keyMetric: 'Shiller P/E',
    keyMetricValue: '41.2×',
    read: "Third-richest CAPE on record after 2021 and 1999. Excess CAPE yield near zero against a 4.6% 10-year — a setup that has historically preceded negative real equity returns over the following decade. The cycle isn't terminal; late expansions run for years. But the asymmetry has shifted decisively to the downside.",
  },
  {
    id: 'credit',
    name: 'Credit cycle',
    phase: 'Slow burn',
    current: 72,
    prior: 60,
    priorDate: 'Q4 2024',
    keyMetric: 'IG–HY spread',
    keyMetricValue: '+320bp',
    read: "Private credit NAV marks rolling over and retail-facing semi-liquid wrappers tightening redemption windows. This is the convergence's leading edge — the cycle most likely to fire first and pull the others into correction.",
  },
  {
    id: 'capex',
    name: 'Juglar / capex',
    phase: 'Late expansion',
    current: 82,
    prior: 70,
    priorDate: 'Q3 2024',
    keyMetric: 'AI capex YoY',
    keyMetricValue: '+38%',
    read: "Hyperscaler AI capex dominates the pulse — and there's no graceful exit. The investment depreciates over six years against revenue that may take a decade to mature. Jevons paradox supports inference demand growth; it doesn't rescue the capex cycle from its duration mismatch.",
  },
  {
    id: 'rate',
    name: 'Rate cycle',
    phase: 'Peak restrictive',
    current: 76,
    prior: 78,
    priorDate: 'Q3 2024',
    keyMetric: 'Real 10Y',
    keyMetricValue: '+2.1%',
    read: "Real rates positive across the curve. Fed restrictive with no clear cut-path until inflation gives cover. Higher-for-longer is the discount-rate headwind underlying every multiple-expansion thesis in the book — Grid Resilience and Retirement Villages most exposed.",
  },
  {
    id: 'sentiment',
    name: 'Narrative / sentiment',
    phase: 'Bifurcated',
    phaseKey: 'bifurcated',
    current: 80,
    prior: 70,
    priorDate: 'Q4 2024',
    keyMetric: 'AAII bull–bear',
    keyMetricValue: '+22pp',
    read: "Euphoric on AI, complacent on credit. Two halves of the same psychological pattern: the new thing absorbs all the optimism while the old thing — credit cycles, refinancing walls, mark-to-model — gets read as solved. It isn't solved.",
  },
];

const lateCycleCount = cycles.filter(c => c.current >= 70).length;

const analogs = [
  {
    period: '1968–69',
    signature: 'Juglar peak + market peak + credit tightening + late-decade complacency',
    outcome: "Stagflation onset 1970–75. 50% equity drawdown 1973–74. The 'Nifty Fifty' multiple compressed by a decade of negative real returns.",
  },
  {
    period: '2000',
    signature: 'Market peak + Juglar peak (tech capex) + narrative euphoria',
    outcome: 'NASDAQ −78%, multi-year capex retrenchment. Information-technology hardware capex took until 2007 to recover prior peak.',
  },
  {
    period: '2007',
    signature: 'Credit peak + market peak + narrative complacency on housing',
    outcome: 'GFC. S&P −57% peak-to-trough. Credit spreads widened 7× in fifteen months. Hyperscaler-equivalent capex froze for two years.',
  },
];

// ---- TYPOGRAPHY ------------------------------------------------------------
const FONT_STYLES = `
  .serif { font-family: 'Fraunces', Georgia, serif; font-feature-settings: 'ss01'; }
  .sans  { font-family: 'Manrope', system-ui, sans-serif; }
  .mono  { font-family: 'JetBrains Mono', ui-monospace, monospace; }
  .nums  { font-variant-numeric: tabular-nums; }
  .label { font-family: 'JetBrains Mono', ui-monospace, monospace; text-transform: uppercase; letter-spacing: 0.16em; font-size: 9.5px; }
`;

// ============================================================================
// APP CONTAINER
// ============================================================================
export default function BellbirdMockupV2Cycles() {
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
      <TopBar />
      <main style={{ maxWidth: 920, margin: '0 auto', padding: '0 32px 96px' }}>
        <PageHeader />
        <Synthesis />
        <CycleGauges />
        <Analogs />
      </main>
    </div>
  );
}

// ============================================================================
// TOP BAR
// ============================================================================
function TopBar() {
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
            const active = m === 'cycles';
            return (
              <div key={m} className="label" style={{
                color: active ? C.chime : C.faint,
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
// PAGE HEADER
// ============================================================================
function PageHeader() {
  return (
    <div style={{ marginBottom: 36 }}>
      <div className="label" style={{ color: C.muted, marginBottom: 6 }}>Macro reading</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 12 }}>
        <h1 className="serif" style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-0.02em', color: C.text, margin: 0, lineHeight: 1.1 }}>
          Cycles
        </h1>
        <div className="mono nums" style={{ fontSize: 10.5, color: C.faint, letterSpacing: '0.08em' }}>
          UPDATED 25 MAY 2026 · LIVE VIA MASSIVE + FRED
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SYNTHESIS — the headline read across all cycles
// ============================================================================
function Synthesis() {
  return (
    <div style={{
      background: C.panel, border: `1px solid ${C.line}`,
      padding: '28px 28px 24px', marginBottom: 48,
    }}>
      {/* Headline */}
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 36, alignItems: 'start', marginBottom: 28 }}>
        <div>
          <div className="mono nums" style={{ fontSize: 64, fontWeight: 700, color: C.chime, lineHeight: 0.95 }}>
            {lateCycleCount}<span style={{ color: C.faint, fontWeight: 400 }}>/5</span>
          </div>
          <div className="label" style={{ color: C.faint, marginTop: 8 }}>Cycles in late or peak phase</div>
        </div>
        <div>
          <div className="label" style={{ color: C.chime, marginBottom: 10 }}>The read · Convergence in progress</div>
          <p className="serif" style={{ fontSize: 15.5, lineHeight: 1.6, color: C.body, margin: 0 }}>
            Market, credit, Juglar and rate cycles all reading 72+. Sentiment bifurcated — euphoric on AI,
            complacent on credit. The book's largest portfolio-level risk is the duration mismatch between
            hyperscaler AI capex (6-year depreciation) and AI revenue (decade+ maturation). Historical parallels:
            1968–69, 2000, 2007. In each, two or more of these cycles peaked within a 24-month window.
          </p>
        </div>
      </div>

      {/* Convergence map: all 5 cycles on one track */}
      <ConvergenceMap />
    </div>
  );
}

function ConvergenceMap() {
  return (
    <div>
      <div className="label" style={{ color: C.muted, marginBottom: 10 }}>Convergence map · all cycles on one track</div>
      <div style={{ position: 'relative', height: 28, marginBottom: 10 }}>
        {/* Zoned background track */}
        <div style={{
          position: 'absolute', left: 0, right: 0, top: 11, height: 6, borderRadius: 2,
          background: `linear-gradient(90deg,
            ${C.trough} 0%, ${C.trough} 18%,
            ${C.expansion} 22%, ${C.expansion} 48%,
            ${C.peak} 52%, ${C.peak} 72%,
            ${C.contraction} 76%, ${C.contraction} 100%)`,
          opacity: 0.7,
        }} />
        {/* Cycle dots */}
        {cycles.map((c, i) => (
          <div key={c.id} style={{
            position: 'absolute', left: `${c.current}%`, top: 5, width: 18, height: 18,
            borderRadius: '50%',
            background: phaseColor(c.current, c.phaseKey),
            border: `2px solid ${C.bg}`,
            transform: 'translateX(-50%)',
            boxShadow: c.current >= 75 ? `0 0 8px ${phaseColor(c.current, c.phaseKey)}99` : 'none',
            zIndex: 5 - i,
          }} title={`${c.name}: ${c.current}`} />
        ))}
      </div>
      {/* Scale labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span className="label" style={{ color: C.trough }}>Trough</span>
        <span className="label" style={{ color: C.expansion }}>Expansion</span>
        <span className="label" style={{ color: C.peak }}>Peak</span>
        <span className="label" style={{ color: C.contraction }}>Contraction</span>
      </div>
    </div>
  );
}

// ============================================================================
// CYCLE GAUGES (stacked)
// ============================================================================
function CycleGauges() {
  return (
    <div style={{ marginBottom: 56 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        marginBottom: 4, paddingBottom: 10, borderBottom: `1px solid ${C.line}`,
      }}>
        <div className="label" style={{ color: C.text }}>The gauges</div>
        <div className="label" style={{ color: C.faint }}>5 cycles · live</div>
      </div>
      {cycles.map(c => <CycleGauge key={c.id} c={c} />)}
    </div>
  );
}

function CycleGauge({ c }) {
  const color = phaseColor(c.current, c.phaseKey);
  const moved = c.current - c.prior;

  return (
    <div style={{ padding: '28px 0 28px', borderBottom: `1px solid ${C.line}` }}>
      {/* Header line */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 24, alignItems: 'baseline', marginBottom: 18 }}>
        <div>
          <h3 className="serif" style={{ fontSize: 19, fontWeight: 600, color: C.text, margin: 0, letterSpacing: '-0.01em' }}>
            {c.name}
          </h3>
          <div style={{ display: 'flex', gap: 16, marginTop: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="label" style={{ color }}>{c.phase}</span>
            <span className="mono" style={{ fontSize: 10.5, color: C.muted, letterSpacing: '0.04em' }}>
              {c.keyMetric} · <span style={{ color: C.text }}>{c.keyMetricValue}</span>
            </span>
          </div>
        </div>
        <div className="mono nums" style={{ fontSize: 10, color: C.faint, letterSpacing: '0.06em', textAlign: 'right' }}>
          PRIOR {c.prior}<br/>{c.priorDate}
        </div>
        <div className="mono nums" style={{ fontSize: 30, fontWeight: 700, color, lineHeight: 1, textAlign: 'right', minWidth: 60 }}>
          {c.current}
        </div>
      </div>

      {/* Track */}
      <div style={{ position: 'relative', height: 12, margin: '0 0 6px' }}>
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 2,
          background: `linear-gradient(90deg,
            ${C.trough} 0%, ${C.trough} 18%,
            ${C.expansion} 22%, ${C.expansion} 48%,
            ${C.peak} 52%, ${C.peak} 72%,
            ${C.contraction} 76%, ${C.contraction} 100%)`,
          opacity: 0.75,
        }} />
        {/* Prior tick */}
        <div style={{
          position: 'absolute', left: `${c.prior}%`, top: -4, bottom: -4,
          width: 1, background: C.body, opacity: 0.35,
        }} title={`Prior: ${c.prior}`} />
        {/* Current marker */}
        <div style={{
          position: 'absolute', left: `${c.current}%`, top: -9, bottom: -9,
          width: 2.5, background: C.chime,
          boxShadow: `0 0 8px ${C.chime}99`, transform: 'translateX(-50%)',
        }}>
          <div style={{
            position: 'absolute', top: -7, left: '50%',
            transform: 'translateX(-50%) rotate(45deg)',
            width: 8, height: 8, background: C.chime,
          }} />
        </div>
      </div>

      {/* Scale labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
        <span className="label" style={{ color: C.faint }}>Trough</span>
        <span className="label" style={{ color: C.faint }}>Expansion</span>
        <span className="label" style={{ color: C.faint }}>Peak</span>
        <span className="label" style={{ color: C.faint }}>Contraction</span>
      </div>

      {/* Read */}
      <p className="serif" style={{
        fontSize: 13.5, fontStyle: 'italic', lineHeight: 1.6,
        color: C.muted, margin: '20px 0 0', maxWidth: '62ch',
      }}>
        {moved !== 0 && (
          <span style={{ color: moved > 0 ? C.contraction : C.expansion, fontStyle: 'normal' }}>
            {moved > 0 ? '↑' : '↓'} {Math.abs(moved)} since {c.priorDate}.&nbsp;
          </span>
        )}
        {c.read}
      </p>
    </div>
  );
}

// ============================================================================
// HISTORICAL ANALOGS
// ============================================================================
function Analogs() {
  return (
    <div>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        marginBottom: 4, paddingBottom: 10, borderBottom: `1px solid ${C.line}`,
      }}>
        <div className="label" style={{ color: C.text }}>Historical parallels</div>
        <div className="label" style={{ color: C.faint }}>Multi-cycle convergence precedents</div>
      </div>
      {analogs.map((a, i) => <AnalogRow key={i} a={a} />)}

      <p className="serif" style={{
        fontSize: 13, fontStyle: 'italic', color: C.faint,
        marginTop: 28, lineHeight: 1.55, maxWidth: '62ch',
      }}>
        In each of these three episodes, two or more of the cycles above peaked within a 24-month
        window. None looked imminent at the time — late-cycle phases ran for 18–36 months before
        the convergence trigger fired. The signal is the clustering, not any single gauge.
      </p>
    </div>
  );
}

function AnalogRow({ a }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '120px 1fr', gap: 32,
      padding: '24px 0', borderBottom: `1px solid ${C.line}`, alignItems: 'baseline',
    }}>
      <div>
        <div className="serif" style={{ fontSize: 26, fontWeight: 600, color: C.text, letterSpacing: '-0.01em', lineHeight: 1 }}>
          {a.period}
        </div>
        <div className="label" style={{ color: C.muted, marginTop: 8 }}>Convergence</div>
      </div>
      <div>
        <div className="mono" style={{ fontSize: 11, color: C.body, letterSpacing: '0.03em', marginBottom: 10 }}>
          {a.signature}
        </div>
        <p className="serif" style={{ fontSize: 14, fontStyle: 'italic', lineHeight: 1.55, color: C.muted, margin: 0, maxWidth: '60ch' }}>
          {a.outcome}
        </p>
      </div>
    </div>
  );
}
