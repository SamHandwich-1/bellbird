import { useState, useEffect } from 'react';
import { Bell, Settings, Plus, ChevronRight, Sparkles, Calendar, TrendingUp, TrendingDown, Activity, BookOpen, MessageSquare, Eye, Briefcase, Gauge, ArrowUpRight } from 'lucide-react';

// ============================================================================
// DESIGN TOKENS — Bellbird palette extends the thesis book aesthetic
// ============================================================================
const tokens = {
  // Surfaces
  paper: '#F2EDE3',
  mist: '#ECE5D5',
  surface: '#E8E0CE',
  hairline: '#C9BFAB',

  // Text
  ink: '#1a1a1a',
  ash: '#6B6B66',
  whisper: '#9A9485',
  fade: '#C9BFAB',

  // Conviction & cycle palette (inherits from book)
  terracotta: '#A0432B',   // low conviction / credit-cycle / alert
  amber: '#B5853A',        // medium conviction / mid-cycle
  sage: '#5C7A4D',         // high conviction / secular / positive
  steel: '#2F4A52',        // long-cycle
  slate: '#6B5C56',        // narrative-cycle

  // Bellbird's accent — the bell note. Reserved for "this matters."
  chime: '#3D5A6C',        // muted steel-blue, the clear ringing note
};

const MODES = [
  { id: 'identity', label: 'Bellbird', icon: Bell },
  { id: 'library', label: 'Library', icon: BookOpen },
  { id: 'develop', label: 'Develop', icon: MessageSquare },
  { id: 'watch', label: 'Watch', icon: Eye },
  { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
  { id: 'cycles', label: 'Cycles', icon: Gauge },
];

const cycleStageColor = (stage) => {
  switch (stage) {
    case 'secular': return tokens.sage;
    case 'long-cycle': return tokens.steel;
    case 'mid-cycle': return tokens.amber;
    case 'credit-cycle': return tokens.terracotta;
    case 'narrative-cycle': return tokens.slate;
    default: return tokens.whisper;
  }
};

const formatStage = (stage) => stage ? stage.toUpperCase().replace(/-/g, ' ') : '';

const convictionColor = (v) => {
  if (v < 40) return tokens.terracotta;
  if (v < 70) return tokens.amber;
  return tokens.sage;
};

// ============================================================================
// MOCK DATA — Representative subset of the book
// ============================================================================
const mockTheses = [
  {
    id: 'grid-resilience-2026',
    name: 'Grid Resilience',
    sector: 'Industrials × Utilities',
    conviction: 80,
    cycleStage: 'secular',
    status: 'active',
    inPortfolio: true,
    topPositions: ['PWR', 'ETN', 'PRYMF'],
    summary: 'Grid hardware names trade at industrial multiples while their cash flows are utility-derivative.',
  },
  {
    id: 'private-credit-slow-burn-2026',
    name: 'Private Credit — Slow Burn',
    sector: 'Financials × Credit Cycle',
    conviction: 78,
    cycleStage: 'credit-cycle',
    status: 'active',
    inPortfolio: false,
    topPositions: ['BX', 'OWL', 'ARCC'],
    summary: 'The damage isn\'t a Lehman cascade — it\'s retail-facing semi-liquid wrappers gating redemptions.',
  },
  {
    id: 'solana-agent-economy-2026',
    name: 'Solana — Agent Economy Settlement',
    sector: 'Crypto × AI Infrastructure',
    conviction: 60,
    cycleStage: 'secular',
    status: 'active',
    inPortfolio: true,
    topPositions: ['BSOL', 'FORD', 'FSOL'],
    summary: 'Pay.sh launches AI agent payments on Solana via USDC. The agent sub-economy is already running.',
  },
  {
    id: 'japan-megabank-roe-2026',
    name: 'Japan Megabank ROE Repricing',
    sector: 'Financials × Japan',
    conviction: 73,
    cycleStage: 'mid-cycle',
    status: 'active',
    inPortfolio: false,
    topPositions: ['MUFG', 'SMFG', 'MFG'],
    summary: 'Japanese megabank ROEs structurally repricing for the first time since the 1990s.',
  },
  {
    id: 'water-ai-capex-2026',
    name: 'Water — Unpriced AI Capex Layer',
    sector: 'Industrials × AI Infrastructure',
    conviction: 72,
    cycleStage: 'secular',
    status: 'active',
    inPortfolio: false,
    topPositions: ['ECL', 'XYL', 'PNR'],
    summary: 'Ecolab paid 29x EBITDA for CoolIT. Smart money signals the water layer of AI capex is repricing.',
  },
];

const mockTriggers = [
  { date: '2026-06-08', thesis: 'AAA Collapse', label: 'RBLX adult monetization launch', priority: 'high' },
  { date: '2026-06-15', thesis: 'Private Credit', label: 'BCRED Q2 redemption print', priority: 'high' },
  { date: '2026-07-15', thesis: 'AAA Collapse', label: 'RBLX Q2 DAU print mid-July', priority: 'high' },
  { date: '2026-08-01', thesis: 'Retirement Villages', label: 'INA half-year settlement data', priority: 'medium' },
  { date: '2026-09-12', thesis: 'Solana', label: 'Alpenglow consensus upgrade live', priority: 'medium' },
  { date: '2026-10-30', thesis: 'EU Banks', label: 'Q3 earnings — UniCredit/UBS', priority: 'low' },
];

const mockPositions = [
  { ticker: 'PWR', name: 'Quanta Services', thesis: 'Grid Resilience', entry: 312.40, current: 348.10, weight: 4.2, pl: 11.4 },
  { ticker: 'ETN', name: 'Eaton', thesis: 'Grid Resilience', entry: 358.20, current: 376.50, weight: 3.4, pl: 5.1 },
  { ticker: 'BSOL', name: 'Bitwise Solana ETF', thesis: 'Solana — Agent Economy', entry: 22.10, current: 18.85, weight: 2.8, pl: -14.7 },
  { ticker: 'FORD', name: 'Forward Industries', thesis: 'Solana — Agent Economy', entry: 14.20, current: 12.55, weight: 2.1, pl: -11.6 },
  { ticker: 'KMI', name: 'Kinder Morgan', thesis: 'Midstream AI Energy', entry: 28.30, current: 33.40, weight: 2.5, pl: 18.0 },
];

const mockConversation = [
  { speaker: 'you', text: 'I\'m worried about RBLX after the Q1 print. Should I trim or hold the AAA Collapse thesis weight?' },
  { speaker: 'bellbird', text: 'The Q1 cut is regulatory friction, not structural breakage. Age verification is throttling engagement temporarily; the underlying UGC-eats-AAA mechanic is intact. Three reasons to hold rather than trim: (1) the structural thesis hasn\'t been falsified, only stress-tested; (2) the June 8 adult monetization launch is the first concrete catalyst for the O18 cohort thesis you bought; (3) $6.2B cash and ARK accumulating into the dislocation. Trim only if Q2 DAU declines >5% sequentially — that\'s structural, not friction.' },
  { speaker: 'you', text: 'And if June 8 disappoints?' },
  { speaker: 'bellbird', text: 'Then you\'re in a value trap with a 192x forward P/E. The execution checkpoint matters. I\'d use tranche-entry discipline if increasing weight: 40-50% now at the dislocation, 30% on June 8 confirmation, 30% on Q3 stabilization. Stop adding if any checkpoint fails.' },
];

// ============================================================================
// APP CONTAINER
// ============================================================================
export default function BellbirdApp() {
  const [mode, setMode] = useState('identity');

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..600;1,9..144,300..500&family=Manrope:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap';
    document.head.appendChild(link);
    return () => { try { document.head.removeChild(link); } catch {} };
  }, []);

  return (
    <div className="min-h-screen" style={{ background: tokens.paper, color: tokens.ink, fontFamily: "'Manrope', system-ui, sans-serif" }}>
      <style>{`
        .serif { font-family: 'Fraunces', Georgia, serif; font-feature-settings: 'ss01'; }
        .sans { font-family: 'Manrope', system-ui, sans-serif; }
        .mono { font-family: 'JetBrains Mono', ui-monospace, monospace; font-feature-settings: 'ss02'; }
        .nums { font-variant-numeric: tabular-nums; }
        .hairline { background: ${tokens.hairline}; height: 1px; }
        .btn-quiet { transition: opacity 200ms ease; }
        .btn-quiet:hover { opacity: 0.5; }
        .lift-on-hover { transition: transform 250ms ease, box-shadow 250ms ease; }
        .lift-on-hover:hover { transform: translateY(-1px); }
        .ring-fade { animation: ring 2.4s ease-out infinite; }
        @keyframes ring {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.12); }
        }
        .mode-pill { transition: color 180ms ease, border-color 180ms ease; }
      `}</style>

      <Header mode={mode} setMode={setMode} />

      <main className="max-w-6xl mx-auto px-6 sm:px-10 pb-24">
        {mode === 'identity' && <IdentityScreen setMode={setMode} />}
        {mode === 'library' && <LibraryScreen />}
        {mode === 'develop' && <DevelopScreen />}
        {mode === 'watch' && <WatchScreen />}
        {mode === 'portfolio' && <PortfolioScreen />}
        {mode === 'cycles' && <CyclesScreen />}
      </main>

      <Footer mode={mode} />
    </div>
  );
}

// ============================================================================
// HEADER — Persistent across all modes
// ============================================================================
function Header({ mode, setMode }) {
  return (
    <header className="border-b" style={{ borderColor: tokens.hairline }}>
      <div className="max-w-6xl mx-auto px-6 sm:px-10 py-5 flex items-center justify-between flex-wrap gap-y-3">
        <button onClick={() => setMode('identity')} className="flex items-baseline gap-3 btn-quiet">
          <span className="serif text-[26px] tracking-tight" style={{ fontWeight: 400 }}>Bellbird</span>
          <span className="sans text-[10px] tracking-[0.22em] uppercase" style={{ color: tokens.whisper }}>Ideas before signals</span>
        </button>

        <nav className="flex items-center gap-6 sm:gap-7">
          {MODES.filter(m => m.id !== 'identity').map(m => {
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className="mode-pill sans text-[11px] tracking-[0.16em] uppercase"
                style={{
                  color: active ? tokens.ink : tokens.whisper,
                  borderBottom: active ? `1px solid ${tokens.chime}` : '1px solid transparent',
                  paddingBottom: 4,
                }}
              >
                {m.label}
              </button>
            );
          })}
          <button className="btn-quiet" style={{ color: tokens.whisper }} title="Settings">
            <Settings size={14} strokeWidth={1.5} />
          </button>
        </nav>
      </div>
    </header>
  );
}

// ============================================================================
// IDENTITY — Brand specimen / cover
// ============================================================================
function IdentityScreen({ setMode }) {
  return (
    <div className="pt-16 sm:pt-24">
      {/* Hero */}
      <div className="mb-24">
        <div className="sans text-[10px] tracking-[0.22em] uppercase mb-6" style={{ color: tokens.whisper }}>
          A clear note in the noise
        </div>
        <h1 className="serif text-[88px] sm:text-[120px] leading-[0.95] tracking-tight" style={{ fontWeight: 320 }}>
          Bellbird
        </h1>
        <div className="mt-8 max-w-[58ch]">
          <p className="serif text-[22px] leading-[1.45]" style={{ fontWeight: 340, color: tokens.ash }}>
            Named for the bell-like call that cuts through the bush. A workspace
            for developing investment theses with deliberation — research, stress-test,
            watch, attribute. Upstream of Wedgetail's monitoring, upstream of Bowerbird's
            decisions. Where ideas are born and refined before they enter the system.
          </p>
        </div>

        <div className="mt-12 flex items-center gap-8 flex-wrap">
          <button
            onClick={() => setMode('library')}
            className="sans text-[11px] tracking-[0.22em] uppercase btn-quiet flex items-center gap-2"
            style={{ color: tokens.ink, borderBottom: `1px solid ${tokens.ink}`, paddingBottom: 4 }}
          >
            Enter library <ArrowUpRight size={12} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => setMode('develop')}
            className="sans text-[11px] tracking-[0.22em] uppercase btn-quiet"
            style={{ color: tokens.whisper }}
          >
            Begin a conversation
          </button>
        </div>
      </div>

      <div className="hairline mb-16" />

      {/* The three birds */}
      <section className="mb-24">
        <div className="sans text-[10px] tracking-[0.22em] uppercase mb-8" style={{ color: tokens.whisper }}>
          The three birds
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
          <BirdCard name="Bellbird" role="Ideation" body="Develops and refines theses with structured deliberation. Curates the watchlist. Stress-tests against contrarian models. Surfaces cross-thesis patterns." current />
          <BirdCard name="Wedgetail" role="Surveillance" body="Watches markets ambient and continuously. Surfaces triggers. Tracks calendar events, earnings, economic data. Reports back to Bellbird when something Bellbird is watching for arrives." />
          <BirdCard name="Bowerbird" role="Decision infrastructure" body="The long-arc platform. Ingests theses from Bellbird, signals from Wedgetail. Runs decision engine, memory, fragility monitor, pair-trade discovery." />
        </div>
      </section>

      <div className="hairline mb-16" />

      {/* Palette */}
      <section className="mb-24">
        <div className="sans text-[10px] tracking-[0.22em] uppercase mb-8" style={{ color: tokens.whisper }}>
          Palette
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Swatch color={tokens.paper} name="Paper" note="Surface" />
          <Swatch color={tokens.mist} name="Mist" note="Card fill" />
          <Swatch color={tokens.ink} name="Ink" note="Primary text" />
          <Swatch color={tokens.chime} name="Chime" note="The bell note" />
          <Swatch color={tokens.sage} name="Sage" note="Secular / high conviction" />
          <Swatch color={tokens.amber} name="Amber" note="Mid-cycle / medium" />
          <Swatch color={tokens.terracotta} name="Terracotta" note="Credit-cycle / low" />
          <Swatch color={tokens.steel} name="Steel" note="Long-cycle" />
        </div>
      </section>

      <div className="hairline mb-16" />

      {/* Typography */}
      <section className="mb-24">
        <div className="sans text-[10px] tracking-[0.22em] uppercase mb-8" style={{ color: tokens.whisper }}>
          Typography
        </div>
        <div className="space-y-8">
          <div>
            <div className="sans text-[10px] tracking-[0.16em] uppercase mb-2" style={{ color: tokens.whisper }}>Display — Fraunces</div>
            <div className="serif text-[56px] leading-[1.05] tracking-tight" style={{ fontWeight: 320 }}>The note before the score.</div>
          </div>
          <div>
            <div className="sans text-[10px] tracking-[0.16em] uppercase mb-2" style={{ color: tokens.whisper }}>Body — Manrope</div>
            <p className="sans text-[15px] leading-[1.7] max-w-[58ch]">
              Each thesis carries an unpriced second-order effect, a cycle classification,
              a watch list of triggers, and a thread of conversation that developed it.
              The library is the artefact of disciplined thinking — not a dashboard, not
              a feed. A collection of considered ideas, arranged.
            </p>
          </div>
          <div>
            <div className="sans text-[10px] tracking-[0.16em] uppercase mb-2" style={{ color: tokens.whisper }}>Numbers — JetBrains Mono</div>
            <div className="mono nums text-[20px]">+25.4%   80%   $12,840.50   2026-06-08</div>
          </div>
        </div>
      </section>
    </div>
  );
}

function BirdCard({ name, role, body, current }) {
  return (
    <div className="p-6" style={{ background: current ? tokens.mist : 'transparent', border: current ? 'none' : `1px solid ${tokens.hairline}` }}>
      <div className="flex items-center gap-2 mb-3">
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: current ? tokens.chime : tokens.whisper }} />
        <div className="sans text-[10px] tracking-[0.22em] uppercase" style={{ color: tokens.whisper }}>{role}</div>
      </div>
      <div className="serif text-[26px] tracking-tight mb-3" style={{ fontWeight: 380 }}>{name}</div>
      <p className="sans text-[13px] leading-[1.65]" style={{ color: tokens.ash }}>{body}</p>
      {current && (
        <div className="mt-4 sans text-[10px] tracking-[0.22em] uppercase" style={{ color: tokens.chime }}>You are here</div>
      )}
    </div>
  );
}

function Swatch({ color, name, note }) {
  return (
    <div>
      <div style={{ background: color, height: 80, border: `1px solid ${tokens.hairline}` }} />
      <div className="mt-2 sans text-[11px]" style={{ color: tokens.ink }}>{name}</div>
      <div className="sans text-[10px] mono" style={{ color: tokens.whisper }}>{color}</div>
      <div className="sans text-[10px] mt-0.5" style={{ color: tokens.whisper }}>{note}</div>
    </div>
  );
}

// ============================================================================
// LIBRARY — Thesis collection
// ============================================================================
function LibraryScreen() {
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState('all'); // all / watchlist / portfolio

  const filtered = mockTheses.filter(t => {
    if (filter !== 'all' && t.cycleStage !== filter) return false;
    if (view === 'portfolio' && !t.inPortfolio) return false;
    if (view === 'watchlist' && t.inPortfolio) return false;
    return true;
  });

  return (
    <div className="pt-12">
      <div className="flex items-baseline justify-between mb-12 flex-wrap gap-4">
        <div>
          <div className="sans text-[10px] tracking-[0.22em] uppercase mb-2" style={{ color: tokens.whisper }}>
            Library
          </div>
          <h1 className="serif text-[44px] tracking-tight" style={{ fontWeight: 340 }}>Theses</h1>
          <div className="mt-2 sans text-[12px]" style={{ color: tokens.ash }}>
            <span className="mono nums">{filtered.length}</span> of <span className="mono nums">{mockTheses.length}</span> · auto-saved
          </div>
        </div>
        <button className="sans text-[10px] tracking-[0.22em] uppercase btn-quiet flex items-center gap-2" style={{ color: tokens.ink }}>
          <Plus size={12} strokeWidth={1.5} /> New thesis
        </button>
      </div>

      {/* View switcher */}
      <div className="flex items-center gap-5 mb-6 flex-wrap">
        <span className="sans text-[10px] tracking-[0.22em] uppercase" style={{ color: tokens.fade }}>Show</span>
        {[
          { id: 'all', label: 'All', count: mockTheses.length },
          { id: 'portfolio', label: 'In portfolio', count: mockTheses.filter(t => t.inPortfolio).length },
          { id: 'watchlist', label: 'Watchlist', count: mockTheses.filter(t => !t.inPortfolio).length },
        ].map(v => (
          <button key={v.id} onClick={() => setView(v.id)} className="sans text-[10px] tracking-[0.16em] uppercase btn-quiet"
            style={{
              color: view === v.id ? tokens.ink : tokens.whisper,
              borderBottom: view === v.id ? `1px solid ${tokens.ink}` : '1px solid transparent',
              paddingBottom: 3,
            }}>
            {v.label} <span className="mono nums ml-1">{v.count}</span>
          </button>
        ))}
      </div>

      {/* Cycle filter */}
      <div className="flex items-center gap-4 mb-10 flex-wrap">
        <span className="sans text-[10px] tracking-[0.22em] uppercase" style={{ color: tokens.fade }}>Stage</span>
        {['all', 'secular', 'long-cycle', 'mid-cycle', 'credit-cycle', 'narrative-cycle'].map(s => {
          const active = filter === s;
          const count = s === 'all' ? mockTheses.length : mockTheses.filter(t => t.cycleStage === s).length;
          const color = s === 'all' ? tokens.ink : cycleStageColor(s);
          return (
            <button key={s} onClick={() => setFilter(s)} className="sans text-[10px] tracking-[0.16em] uppercase btn-quiet"
              style={{
                color: active ? color : tokens.whisper,
                borderBottom: active ? `1px solid ${color}` : '1px solid transparent',
                paddingBottom: 3,
              }}>
              {s === 'all' ? 'All' : formatStage(s)} <span className="mono nums ml-1">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="hairline mb-10" />

      {/* Theses */}
      <div className="space-y-12">
        {filtered.map(t => <ThesisCard key={t.id} thesis={t} />)}
      </div>
    </div>
  );
}

function ThesisCard({ thesis }) {
  return (
    <article className="lift-on-hover" style={{ cursor: 'pointer' }}>
      <div className="flex items-baseline gap-5 mb-3 flex-wrap">
        <h2 className="serif text-[28px] sm:text-[34px] leading-[1.05] tracking-tight" style={{ fontWeight: 380 }}>
          {thesis.name}
        </h2>
        <ConvictionBar value={thesis.conviction} />
        {thesis.inPortfolio && (
          <span className="sans text-[9px] tracking-[0.22em] uppercase px-2 py-1" style={{ background: tokens.mist, color: tokens.chime }}>
            In portfolio
          </span>
        )}
      </div>
      <div className="sans text-[11px] tracking-[0.06em] flex flex-wrap items-center gap-x-3 gap-y-1" style={{ color: tokens.ash }}>
        <span>{thesis.sector}</span>
        <span style={{ color: tokens.fade }}>·</span>
        <span className="uppercase tracking-[0.16em] text-[10px]" style={{ color: tokens.ink }}>{thesis.status}</span>
        <span style={{ color: tokens.fade }}>·</span>
        <span className="uppercase tracking-[0.16em] text-[10px]" style={{ color: cycleStageColor(thesis.cycleStage) }}>
          {formatStage(thesis.cycleStage)}
        </span>
        <span style={{ color: tokens.fade }}>·</span>
        <span className="mono nums text-[10px]">{thesis.topPositions.join(' · ')}</span>
      </div>
      <p className="serif text-[17px] leading-[1.55] mt-4" style={{ fontWeight: 340, color: tokens.ash, maxWidth: '62ch' }}>
        {thesis.summary}
      </p>
      <div className="mt-4 flex items-center gap-5 flex-wrap">
        <button className="sans text-[10px] tracking-[0.16em] uppercase btn-quiet flex items-center gap-1.5" style={{ color: tokens.ink }}>
          Open <ChevronRight size={11} strokeWidth={1.5} />
        </button>
        <button className="sans text-[10px] tracking-[0.16em] uppercase btn-quiet flex items-center gap-1.5" style={{ color: tokens.chime }}>
          <Sparkles size={11} strokeWidth={1.5} /> Stress test
        </button>
        <button className="sans text-[10px] tracking-[0.16em] uppercase btn-quiet" style={{ color: tokens.whisper }}>
          Develop
        </button>
        {!thesis.inPortfolio && (
          <button className="sans text-[10px] tracking-[0.16em] uppercase btn-quiet" style={{ color: tokens.whisper }}>
            Activate
          </button>
        )}
      </div>
    </article>
  );
}

function ConvictionBar({ value }) {
  const color = convictionColor(value);
  return (
    <span className="inline-flex items-center gap-2.5">
      <span style={{ display: 'inline-block', width: 64, height: 2, background: tokens.surface, position: 'relative' }}>
        <span style={{ position: 'absolute', left: 0, top: 0, height: 2, width: `${value}%`, background: color }} />
      </span>
      <span className="mono nums" style={{ fontSize: 11, color, letterSpacing: '0.02em' }}>{value}%</span>
    </span>
  );
}

// ============================================================================
// DEVELOP — Editorial conversation interface with stress-test panel
// ============================================================================
function DevelopScreen() {
  const [stressOpen, setStressOpen] = useState(false);

  return (
    <div className="pt-12 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12">
      <div>
        <div className="sans text-[10px] tracking-[0.22em] uppercase mb-2" style={{ color: tokens.whisper }}>
          Develop
        </div>
        <h1 className="serif text-[36px] tracking-tight mb-1" style={{ fontWeight: 340 }}>
          AAA Collapse / Platform Compound
        </h1>
        <div className="sans text-[11px] tracking-[0.06em] flex flex-wrap items-center gap-x-3" style={{ color: tokens.ash }}>
          <span>Consumer × Gaming Platforms</span>
          <span style={{ color: tokens.fade }}>·</span>
          <span className="uppercase tracking-[0.16em] text-[10px]" style={{ color: cycleStageColor('secular') }}>SECULAR</span>
          <span style={{ color: tokens.fade }}>·</span>
          <span className="mono nums">72% conviction</span>
        </div>

        <div className="hairline mt-8 mb-12" />

        <div className="space-y-12">
          {mockConversation.map((m, i) => (
            <ConversationTurn key={i} speaker={m.speaker} text={m.text} />
          ))}
        </div>

        <div className="mt-16 p-5" style={{ background: tokens.mist, border: `1px solid ${tokens.hairline}` }}>
          <div className="sans text-[10px] tracking-[0.22em] uppercase mb-3" style={{ color: tokens.whisper }}>
            Your turn
          </div>
          <textarea
            placeholder="Continue the conversation, or paste news/data for impact analysis..."
            rows={3}
            className="serif text-[16px] bg-transparent w-full leading-[1.6] resize-none"
            style={{ fontWeight: 340, color: tokens.ink, outline: 'none' }}
          />
          <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-5">
              <button className="sans text-[10px] tracking-[0.22em] uppercase btn-quiet flex items-center gap-1.5" style={{ color: tokens.ink }}>
                Send <ArrowUpRight size={11} strokeWidth={1.5} />
              </button>
              <button className="sans text-[10px] tracking-[0.16em] uppercase btn-quiet" style={{ color: tokens.whisper }}>
                Web search
              </button>
              <button onClick={() => setStressOpen(!stressOpen)} className="sans text-[10px] tracking-[0.16em] uppercase btn-quiet flex items-center gap-1.5" style={{ color: tokens.chime }}>
                <Sparkles size={11} strokeWidth={1.5} /> Stress test
              </button>
            </div>
            <span className="sans text-[10px] tracking-[0.16em] uppercase mono" style={{ color: tokens.fade }}>
              Claude · Sonnet 4.6
            </span>
          </div>
        </div>
      </div>

      {/* Stress-test panel */}
      <aside className="lg:sticky lg:top-6 self-start">
        {stressOpen ? <StressTestPanel onClose={() => setStressOpen(false)} /> : <ContextPanel />}
      </aside>
    </div>
  );
}

function ConversationTurn({ speaker, text }) {
  const isBellbird = speaker === 'bellbird';
  return (
    <div>
      <div className="sans text-[10px] tracking-[0.22em] uppercase mb-3" style={{ color: isBellbird ? tokens.chime : tokens.whisper }}>
        {isBellbird ? 'Bellbird' : 'You'}
      </div>
      <div className="serif text-[17px] leading-[1.65]" style={{ fontWeight: 340, color: isBellbird ? tokens.ink : tokens.ash, maxWidth: '62ch' }}>
        {text}
      </div>
    </div>
  );
}

function ContextPanel() {
  return (
    <div className="p-5" style={{ background: tokens.mist, border: `1px solid ${tokens.hairline}` }}>
      <div className="sans text-[10px] tracking-[0.22em] uppercase mb-4" style={{ color: tokens.whisper }}>
        Thesis context
      </div>
      <div className="space-y-4">
        <ContextItem label="Positions" value="8 · 76% long / 24% short" />
        <ContextItem label="Top long" value="RBLX 30%" mono />
        <ContextItem label="Top short" value="TTWO 12%" mono />
        <ContextItem label="Last update" value="2 days ago" />
        <ContextItem label="Open triggers" value="3" mono />
        <ContextItem label="Linked positions" value="0 active" />
      </div>
      <div className="hairline my-5" />
      <div className="sans text-[10px] tracking-[0.22em] uppercase mb-3" style={{ color: tokens.whisper }}>
        Recent news
      </div>
      <div className="serif text-[13px] leading-[1.55] italic" style={{ color: tokens.ash }}>
        "RBLX down 70% from $150 ATH after Q1 cut guidance ~$1B; age verification friction. ARK buying."
      </div>
      <div className="mt-2 sans text-[10px] mono" style={{ color: tokens.whisper }}>3 days ago</div>
    </div>
  );
}

function ContextItem({ label, value, mono }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="sans text-[10px] tracking-[0.16em] uppercase" style={{ color: tokens.whisper }}>{label}</span>
      <span className={`text-[12px] ${mono ? 'mono nums' : 'sans'}`} style={{ color: tokens.ink }}>{value}</span>
    </div>
  );
}

function StressTestPanel({ onClose }) {
  return (
    <div className="p-5" style={{ background: tokens.paper, border: `1px solid ${tokens.chime}` }}>
      <div className="flex items-center justify-between mb-3">
        <div className="sans text-[10px] tracking-[0.22em] uppercase flex items-center gap-1.5" style={{ color: tokens.chime }}>
          <Sparkles size={11} strokeWidth={1.5} /> Stress test · Grok
        </div>
        <button onClick={onClose} className="sans text-[10px] tracking-[0.16em] uppercase btn-quiet" style={{ color: tokens.whisper }}>
          ×
        </button>
      </div>

      <div className="sans text-[10px] tracking-[0.16em] uppercase mb-2" style={{ color: tokens.whisper }}>
        Contrarian view
      </div>
      <p className="serif text-[14px] leading-[1.6]" style={{ fontWeight: 340, color: tokens.ink }}>
        The UGC-eats-AAA thesis assumes Gen Alpha cohort discipline persists. X-data sentiment on Roblox among 14-18 demographic is fragmenting fast — Fortnite Creative momentum and TikTok-native gaming are pulling attention. June 8 monetization may juice creator earnings but consumer ARPU could compress if engagement keeps softening. Real risk: the structural thesis is right but RBLX specifically isn't the winner.
      </p>

      <div className="hairline my-4" />

      <div className="sans text-[10px] tracking-[0.16em] uppercase mb-2" style={{ color: tokens.whisper }}>
        Where models disagree
      </div>
      <div className="space-y-2 text-[11px] sans">
        <DisagreementRow claim="UGC eats AAA structurally" claude="Strong" grok="Strong" />
        <DisagreementRow claim="RBLX is the winning platform" claude="Strong" grok="Weakening" warn />
        <DisagreementRow claim="June 8 is a clean catalyst" claude="Strong" grok="Mixed" warn />
      </div>

      <button className="mt-5 sans text-[10px] tracking-[0.16em] uppercase btn-quiet flex items-center gap-1.5" style={{ color: tokens.ink }}>
        Add to conversation <ArrowUpRight size={11} strokeWidth={1.5} />
      </button>
    </div>
  );
}

function DisagreementRow({ claim, claude, grok, warn }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span style={{ color: tokens.ash, fontSize: 11 }}>{claim}</span>
      <span className="mono nums" style={{ color: warn ? tokens.amber : tokens.sage, fontSize: 10 }}>
        {claude} / {grok}
      </span>
    </div>
  );
}

// ============================================================================
// WATCH — Triggers and calendar
// ============================================================================
function WatchScreen() {
  return (
    <div className="pt-12">
      <div className="flex items-baseline justify-between mb-12 flex-wrap gap-4">
        <div>
          <div className="sans text-[10px] tracking-[0.22em] uppercase mb-2" style={{ color: tokens.whisper }}>
            Watch
          </div>
          <h1 className="serif text-[44px] tracking-tight" style={{ fontWeight: 340 }}>Triggers</h1>
          <div className="mt-2 sans text-[12px]" style={{ color: tokens.ash }}>
            <span className="mono nums">{mockTriggers.length}</span> upcoming · <span className="mono nums">3</span> within 30 days
          </div>
        </div>
        <div className="flex items-center gap-5">
          <button className="sans text-[10px] tracking-[0.22em] uppercase btn-quiet flex items-center gap-2" style={{ color: tokens.whisper }}>
            <Calendar size={12} strokeWidth={1.5} /> Export .ics
          </button>
          <button className="sans text-[10px] tracking-[0.22em] uppercase btn-quiet flex items-center gap-2" style={{ color: tokens.ink }}>
            <Plus size={12} strokeWidth={1.5} /> New trigger
          </button>
        </div>
      </div>

      <div className="hairline mb-10" />

      <div className="space-y-6">
        {mockTriggers.map((t, i) => <TriggerRow key={i} trigger={t} />)}
      </div>
    </div>
  );
}

function TriggerRow({ trigger }) {
  const priorityColor = trigger.priority === 'high' ? tokens.terracotta : trigger.priority === 'medium' ? tokens.amber : tokens.sage;
  const date = new Date(trigger.date);
  const day = date.getDate();
  const month = date.toLocaleString('en', { month: 'short' }).toUpperCase();

  return (
    <div className="lift-on-hover grid grid-cols-[80px_1fr_auto] gap-6 py-4 items-center" style={{ borderBottom: `1px solid ${tokens.surface}`, cursor: 'pointer' }}>
      <div>
        <div className="mono nums text-[32px] leading-none" style={{ color: tokens.ink, fontWeight: 500 }}>{day}</div>
        <div className="sans text-[10px] tracking-[0.16em] mt-1" style={{ color: tokens.whisper }}>{month} 2026</div>
      </div>
      <div>
        <div className="sans text-[10px] tracking-[0.22em] uppercase mb-1" style={{ color: tokens.whisper }}>{trigger.thesis}</div>
        <div className="serif text-[19px]" style={{ fontWeight: 340, color: tokens.ink }}>{trigger.label}</div>
      </div>
      <div className="flex items-center gap-2">
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: priorityColor }} />
        <span className="sans text-[10px] tracking-[0.16em] uppercase" style={{ color: priorityColor }}>{trigger.priority}</span>
      </div>
    </div>
  );
}

// ============================================================================
// PORTFOLIO — Active positions
// ============================================================================
function PortfolioScreen() {
  const totalPL = mockPositions.reduce((s, p) => s + (p.weight * p.pl / 100), 0);

  return (
    <div className="pt-12">
      <div className="flex items-baseline justify-between mb-12 flex-wrap gap-4">
        <div>
          <div className="sans text-[10px] tracking-[0.22em] uppercase mb-2" style={{ color: tokens.whisper }}>
            Portfolio
          </div>
          <h1 className="serif text-[44px] tracking-tight" style={{ fontWeight: 340 }}>Active positions</h1>
          <div className="mt-2 sans text-[12px]" style={{ color: tokens.ash }}>
            <span className="mono nums">{mockPositions.length}</span> positions across <span className="mono nums">3</span> theses
          </div>
        </div>
        <div className="text-right">
          <div className="sans text-[10px] tracking-[0.22em] uppercase mb-1" style={{ color: tokens.whisper }}>
            Blended return
          </div>
          <div className="mono nums text-[36px] leading-none" style={{ color: totalPL > 0 ? tokens.sage : tokens.terracotta, fontWeight: 500 }}>
            {totalPL > 0 ? '+' : ''}{totalPL.toFixed(2)}%
          </div>
        </div>
      </div>

      <div className="hairline mb-6" />

      <div className="grid grid-cols-12 gap-3 sans text-[10px] tracking-[0.16em] uppercase py-3" style={{ color: tokens.fade }}>
        <div className="col-span-2">Ticker</div>
        <div className="col-span-3">Name</div>
        <div className="col-span-3">Thesis</div>
        <div className="col-span-1 text-right">Weight</div>
        <div className="col-span-1 text-right">Entry</div>
        <div className="col-span-1 text-right">Current</div>
        <div className="col-span-1 text-right">P/L</div>
      </div>
      <div className="hairline" />

      {mockPositions.map((p, i) => <PositionRow key={i} position={p} />)}

      <div className="mt-8">
        <button className="sans text-[10px] tracking-[0.22em] uppercase btn-quiet flex items-center gap-2" style={{ color: tokens.ink }}>
          <Plus size={12} strokeWidth={1.5} /> Open position from watchlist
        </button>
      </div>
    </div>
  );
}

function PositionRow({ position }) {
  const positive = position.pl > 0;
  return (
    <div className="grid grid-cols-12 gap-3 items-baseline py-4 lift-on-hover" style={{ borderBottom: `1px solid ${tokens.surface}`, cursor: 'pointer' }}>
      <div className="col-span-2 mono text-[14px]" style={{ color: tokens.ink, fontWeight: 500 }}>{position.ticker}</div>
      <div className="col-span-3 sans text-[13px]" style={{ color: tokens.ash }}>{position.name}</div>
      <div className="col-span-3 sans text-[11px] tracking-[0.04em]" style={{ color: tokens.whisper }}>{position.thesis}</div>
      <div className="col-span-1 mono nums text-[13px] text-right" style={{ color: tokens.ink }}>{position.weight}%</div>
      <div className="col-span-1 mono nums text-[12px] text-right" style={{ color: tokens.whisper }}>${position.entry.toFixed(2)}</div>
      <div className="col-span-1 mono nums text-[12px] text-right" style={{ color: tokens.ink }}>${position.current.toFixed(2)}</div>
      <div className="col-span-1 mono nums text-[13px] text-right flex items-center justify-end gap-1" style={{ color: positive ? tokens.sage : tokens.terracotta, fontWeight: 500 }}>
        {positive ? <TrendingUp size={10} strokeWidth={2} /> : <TrendingDown size={10} strokeWidth={2} />}
        {positive ? '+' : ''}{position.pl.toFixed(1)}%
      </div>
    </div>
  );
}

// ============================================================================
// CYCLES — Three-cycle dashboard with traffic-light readouts
// ============================================================================
function CyclesScreen() {
  return (
    <div className="pt-12">
      <div className="mb-12">
        <div className="sans text-[10px] tracking-[0.22em] uppercase mb-2" style={{ color: tokens.whisper }}>
          Cycles
        </div>
        <h1 className="serif text-[44px] tracking-tight" style={{ fontWeight: 340 }}>The three cycles</h1>
        <p className="serif text-[17px] leading-[1.55] mt-3" style={{ fontWeight: 340, color: tokens.ash, maxWidth: '62ch' }}>
          Credit leads, capex follows, equity reflects last. When all three peak together,
          it has historically preceded major drawdowns (1968, 2000, 2007). Watch the
          divergences as much as the levels.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
        <CycleGauge name="Credit cycle" status="alert" reading="Turning" detail="Private credit gates triggering. BDC discounts widening. Spreads still tight publicly — divergence." />
        <CycleGauge name="Market cycle" status="caution" reading="Late expansion" detail="Equity dispersion rising. Concentration risk. Multiples extended on AI complex." />
        <CycleGauge name="Juglar (capex)" status="caution" reading="Peaking" detail="$800B 2026 hyperscaler capex. No graceful exit. Watch credit transmission." />
      </div>

      <div className="hairline mb-10" />

      <div className="mb-12">
        <div className="sans text-[10px] tracking-[0.22em] uppercase mb-6" style={{ color: tokens.whisper }}>
          Book distribution by cycle stage
        </div>
        <div className="space-y-3">
          <DistRow stage="secular" count={10} total={19} label="Survives cycle drawdowns" />
          <DistRow stage="mid-cycle" count={4} total={19} label="Active alpha now" />
          <DistRow stage="long-cycle" count={2} total={19} label="Multi-decade horizon" />
          <DistRow stage="narrative-cycle" count={2} total={19} label="Pre-committed exits" />
          <DistRow stage="credit-cycle" count={1} total={19} label="Stage 1 — close before Stage 2" />
        </div>
      </div>

      <div className="hairline mb-10" />

      <div>
        <div className="sans text-[10px] tracking-[0.22em] uppercase mb-4" style={{ color: tokens.whisper }}>
          Cycle stage rotation map
        </div>
        <p className="serif text-[15px] leading-[1.6] italic" style={{ fontWeight: 340, color: tokens.ash, maxWidth: '62ch' }}>
          Stage 1 (NOW): Private Credit active alpha · Japan Megabank · Silver build · Brand Korea<br/>
          Stage 2 (12-18mo): Yen activation · Uranium decouple · Robotaxi narrative break risk<br/>
          Stage 3 (24-36mo): Copper deployment · Retirement Villages re-rate · Recovery rotation
        </p>
      </div>
    </div>
  );
}

function CycleGauge({ name, status, reading, detail }) {
  const color = status === 'alert' ? tokens.terracotta : status === 'caution' ? tokens.amber : tokens.sage;
  return (
    <div className="p-6 lift-on-hover" style={{ background: tokens.mist, cursor: 'pointer' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="sans text-[10px] tracking-[0.22em] uppercase" style={{ color: tokens.whisper }}>{name}</div>
        <div className="relative">
          <div className="ring-fade absolute inset-0" style={{ borderRadius: '50%', background: color, opacity: 0.3 }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, position: 'relative' }} />
        </div>
      </div>
      <div className="serif text-[24px] tracking-tight mb-2" style={{ fontWeight: 380, color: tokens.ink }}>
        {reading}
      </div>
      <p className="sans text-[12px] leading-[1.6]" style={{ color: tokens.ash }}>
        {detail}
      </p>
    </div>
  );
}

function DistRow({ stage, count, total, label }) {
  const pct = (count / total) * 100;
  const color = cycleStageColor(stage);
  return (
    <div className="grid grid-cols-12 items-center gap-3">
      <div className="col-span-3 sans text-[11px] tracking-[0.16em] uppercase" style={{ color }}>{formatStage(stage)}</div>
      <div className="col-span-1 mono nums text-[12px]" style={{ color: tokens.ink }}>{count}</div>
      <div className="col-span-5" style={{ height: 2, background: tokens.surface, position: 'relative' }}>
        <div style={{ height: 2, width: `${pct}%`, background: color }} />
      </div>
      <div className="col-span-3 sans text-[11px] italic" style={{ color: tokens.ash, fontFamily: "'Fraunces', serif" }}>{label}</div>
    </div>
  );
}

// ============================================================================
// FOOTER
// ============================================================================
function Footer({ mode }) {
  return (
    <footer className="max-w-6xl mx-auto px-6 sm:px-10 mt-16">
      <div className="hairline" />
      <div className="py-6 flex items-center justify-between flex-wrap gap-3">
        <div className="sans text-[10px] tracking-[0.22em] uppercase" style={{ color: tokens.fade }}>
          Bellbird · v0 mockup
        </div>
        <div className="sans text-[10px] tracking-[0.22em] uppercase" style={{ color: tokens.fade }}>
          Currently viewing · {MODES.find(m => m.id === mode)?.label}
        </div>
      </div>
    </footer>
  );
}
