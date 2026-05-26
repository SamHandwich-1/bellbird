import React, { useState, useEffect } from 'react';

// ============================================================================
// BELLBIRD v2 PREVIEW — Identity + Develop + Watch + Portfolio
//
// Four modes in one file with a mode switcher at top. Patterns reused from
// the established v2 system (palette, fonts, panel pattern, section pattern,
// gauge pattern). Net-new patterns introduced here:
//
//   - PrincipleRow (lens / circle of competence / biases rows)
//   - ServiceStatus (connected API row with status dot)
//   - ChatBubble (user + opus message variants, plus inline data-fetch event)
//   - VoiceButton (toggleable mic input)
//   - ContextPane (right-side scratch pad in Develop)
//   - TriggerPill (small status pill with type colour)
//   - GammaArrow (rising / falling / flat directional indicator)
//   - AllocationBar (horizontal stacked bar by thesis)
//
// Identity & Develop are interactive (state changes), Watch & Portfolio
// are static-but-realistic for review purposes.
// ============================================================================

// ---- PALETTE ---------------------------------------------------------------
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

  // Cycle / conviction palette (matches v2 system)
  terracotta: '#c25234',
  amber:      '#cf9a47',
  sage:       '#7a9e6a',
  steel:      '#7fa8c9',
  slate:      '#9a8a82',

  // Trigger-type colours (per item 7 schema)
  confirming:   '#7a9e6a',   // sage
  disconfirming:'#cf9a47',   // amber
  kill:         '#c25234',   // terracotta
  action:       '#d9803f',   // chime
};

const cycleColor = (s) => ({
  'secular':         C.sage,
  'long-cycle':      C.steel,
  'mid-cycle':       C.amber,
  'credit-cycle':    C.terracotta,
  'narrative-cycle': C.slate,
}[s] || C.muted);

const convictionColor = (v) => v < 40 ? C.terracotta : v < 70 ? C.amber : C.sage;

// ---- TYPOGRAPHY ------------------------------------------------------------
const FONT_STYLES = `
  .serif { font-family: 'Fraunces', Georgia, serif; font-feature-settings: 'ss01'; }
  .sans  { font-family: 'Manrope', system-ui, sans-serif; }
  .mono  { font-family: 'JetBrains Mono', ui-monospace, monospace; }
  .nums  { font-variant-numeric: tabular-nums; }
  .label { font-family: 'JetBrains Mono', ui-monospace, monospace; text-transform: uppercase; letter-spacing: 0.16em; font-size: 9.5px; }
  .hairline-row { transition: background 200ms ease; }
  .hairline-row:hover { background: ${C.panel}; }
  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 0 0 ${C.chime}aa; }
    50%      { box-shadow: 0 0 0 6px ${C.chime}00; }
  }
`;

// ============================================================================
// APP CONTAINER
// ============================================================================
export default function BellbirdMockupV2Stack() {
  const [mode, setMode] = useState('identity');

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
      <TopBar mode={mode} onChange={setMode} />
      <main style={{ maxWidth: 920, margin: '0 auto', padding: '0 32px 96px' }}>
        {mode === 'identity'  && <IdentityMode />}
        {mode === 'develop'   && <DevelopMode />}
        {mode === 'watch'     && <WatchMode />}
        {mode === 'portfolio' && <PortfolioMode />}
      </main>
    </div>
  );
}

// ============================================================================
// TOP BAR
// ============================================================================
function TopBar({ mode, onChange }) {
  const modes = ['identity','library','develop','watch','portfolio','cycles'];
  const interactive = ['identity','develop','watch','portfolio'];
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
            const active = m === mode;
            const clickable = interactive.includes(m);
            return (
              <div
                key={m}
                className="label"
                onClick={clickable ? () => onChange(m) : undefined}
                style={{
                  color: active ? C.chime : C.faint,
                  paddingBottom: 2,
                  borderBottom: active ? `1px solid ${C.chime}` : '1px solid transparent',
                  cursor: clickable ? 'pointer' : 'default',
                }}
              >
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
// SECTION (shared pattern)
// ============================================================================
function Section({ label, right, children, dense = false }) {
  return (
    <div style={{ marginBottom: dense ? 32 : 48 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        marginBottom: 16, paddingBottom: 10, borderBottom: `1px solid ${C.line}`,
      }}>
        <div className="label" style={{ color: C.text }}>{label}</div>
        {right && <div className="mono" style={{ fontSize: 10, color: C.faint, letterSpacing: '0.06em' }}>{right.toUpperCase()}</div>}
      </div>
      {children}
    </div>
  );
}

// ============================================================================
// IDENTITY MODE
// ============================================================================
function IdentityMode() {
  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 36 }}>
        <div className="label" style={{ color: C.muted, marginBottom: 6 }}>Investor profile</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 12 }}>
          <h1 className="serif" style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-0.02em', color: C.text, margin: 0, lineHeight: 1.1 }}>
            Identity
          </h1>
          <div className="mono nums" style={{ fontSize: 10.5, color: C.faint, letterSpacing: '0.08em' }}>
            LAST EDITED · 22 MAY 2026
          </div>
        </div>
      </div>

      <Section label="The investor">
        <p className="serif" style={{ fontSize: 16, lineHeight: 1.65, color: C.body, margin: 0, maxWidth: '62ch' }}>
          Melbourne-based investor focused on non-consensus, second-order trades. Bellbird is the workspace
          for theses that require expectations-gap discipline and downside-first survival testing. Targets
          unpriced second-order effects rather than directional macro calls. Wedgetail handles live portfolio
          state, trigger automation, and draft execution.
        </p>
      </Section>

      <Section label="The lens" right="Behavioural frameworks">
        <PrincipleRow name="Marks"      role="Second-level thinking · asymmetry over directional bets" />
        <PrincipleRow name="Mauboussin" role="Expectations gap · what's priced vs what's likely" />
        <PrincipleRow name="Munger"     role="Inversion · what would kill this?" />
        <PrincipleRow name="Klarman"    role="Permanent loss as the only real risk" />
        <PrincipleRow name="Buffett"    role="Circle of competence · four-sentence thesis test" />
        <p className="serif" style={{ fontSize: 13, fontStyle: 'italic', color: C.faint, margin: '14px 0 0', maxWidth: '60ch' }}>
          These lenses are encoded behaviourally in the Develop pipeline — one primary lens per phase,
          never stacked. Frameworks shape questions; they don't get named in prompts.
        </p>
      </Section>

      <Section label="Circle of competence">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          <div>
            <div className="label" style={{ color: C.sage, marginBottom: 12 }}>Engaged</div>
            <CompetenceItem text="Industrial commodities (Cu, Ag, U)" />
            <CompetenceItem text="AI infrastructure equities" />
            <CompetenceItem text="Credit cycle dynamics" />
            <CompetenceItem text="Japan financials" />
            <CompetenceItem text="Macro / cycles" />
            <CompetenceItem text="Solana ecosystem" />
          </div>
          <div>
            <div className="label" style={{ color: C.terracotta, marginBottom: 12 }}>Avoided</div>
            <CompetenceItem text="Biotech (binary outcomes)" muted />
            <CompetenceItem text="Crypto altcoins (no edge)" muted />
            <CompetenceItem text="Single-stock options" muted />
            <CompetenceItem text="China A-shares" muted />
            <CompetenceItem text="Emerging-market sovereign debt" muted />
          </div>
        </div>
      </Section>

      <Section label="Biases to counterbalance" right="Self-declared">
        <BiasRow bias="Strong negative prior on Meta" counter="Counterweight with rigorous valuation work; quote source figures, not impressions" />
        <BiasRow bias="Education-sector bias from prior career" counter="Let data lead. Apply equal scepticism to thesis and anti-thesis" />
        <BiasRow bias="Recency bias on AI capex narrative" counter="Discipline via historical analogs — every AI thesis tested against the 1999 tech-capex analog" />
      </Section>

      <Section label="Data connections" right="Status · live">
        <ServiceStatus name="Massive" sub="Markets · ex-Polygon" status="connected" />
        <ServiceStatus name="FRED"    sub="Macro · St. Louis Fed" status="connected" />
        <ServiceStatus name="OpenAI Whisper" sub="Voice input · Develop chat" status="connected" />
        <ServiceStatus name="NBER recession dates" sub="Cycles · History" status="connected" />
        <ServiceStatus name="Wedgetail" sub="Portfolio state · planned integration" status="planned" />
      </Section>

      <Section label="Settings" dense>
        <SettingRow label="Voice input" value="Toggle · tap to start / tap to stop" />
        <SettingRow label="Default sub-tab on Cycles" value="Now" />
        <SettingRow label="Develop autosave" value="On · every message" />
        <SettingRow label="Trigger notifications" value="Off · deferred to Wedgetail" />
      </Section>
    </div>
  );
}

function PrincipleRow({ name, role }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '120px 1fr',
      gap: 24, padding: '14px 0', borderBottom: `1px solid ${C.line}`, alignItems: 'baseline',
    }}>
      <div className="serif" style={{ fontSize: 17, fontWeight: 600, color: C.text, letterSpacing: '-0.01em' }}>{name}</div>
      <div className="serif" style={{ fontSize: 14, color: C.body, lineHeight: 1.5 }}>{role}</div>
    </div>
  );
}

function CompetenceItem({ text, muted }) {
  return (
    <div style={{ padding: '8px 0', borderBottom: `1px solid ${C.line}` }}>
      <span className="serif" style={{ fontSize: 14, color: muted ? C.muted : C.body, lineHeight: 1.5 }}>{text}</span>
    </div>
  );
}

function BiasRow({ bias, counter }) {
  return (
    <div style={{ padding: '16px 0', borderBottom: `1px solid ${C.line}` }}>
      <div className="serif" style={{ fontSize: 14.5, color: C.body, marginBottom: 6 }}>{bias}</div>
      <div className="serif" style={{ fontSize: 13, fontStyle: 'italic', color: C.muted, maxWidth: '62ch', lineHeight: 1.55 }}>
        <span className="label" style={{ color: C.chime, marginRight: 8 }}>Counter</span>
        {counter}
      </div>
    </div>
  );
}

function ServiceStatus({ name, sub, status }) {
  const statusColor = status === 'connected' ? C.sage : status === 'planned' ? C.faint : C.terracotta;
  const statusLabel = status.toUpperCase();
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 24,
      padding: '14px 0', borderBottom: `1px solid ${C.line}`, alignItems: 'baseline',
    }}>
      <div>
        <div className="serif" style={{ fontSize: 15, color: C.text, fontWeight: 500 }}>{name}</div>
        <div className="mono" style={{ fontSize: 10.5, color: C.faint, marginTop: 3, letterSpacing: '0.03em' }}>{sub}</div>
      </div>
      <div style={{
        width: 7, height: 7, borderRadius: '50%', background: statusColor,
        boxShadow: status === 'connected' ? `0 0 6px ${statusColor}99` : 'none',
        alignSelf: 'center',
      }} />
      <div className="label" style={{ color: statusColor }}>{statusLabel}</div>
    </div>
  );
}

function SettingRow({ label, value }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      padding: '12px 0', borderBottom: `1px solid ${C.line}`,
    }}>
      <span className="serif" style={{ fontSize: 14, color: C.body }}>{label}</span>
      <span className="mono" style={{ fontSize: 11.5, color: C.muted, letterSpacing: '0.03em' }}>{value}</span>
    </div>
  );
}

// ============================================================================
// DEVELOP MODE
// ============================================================================
function DevelopMode() {
  const [voiceActive, setVoiceActive] = useState(false);
  const [inputText, setInputText] = useState('');

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <div className="label" style={{ color: C.muted, marginBottom: 6 }}>New thesis conversation · auto-saving</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 12 }}>
          <h1 className="serif" style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.02em', color: C.text, margin: 0, lineHeight: 1.1 }}>
            Insurance · AI eats labour cost
          </h1>
          <div className="mono nums" style={{ fontSize: 10.5, color: C.faint, letterSpacing: '0.08em' }}>
            17 MIN  ·  DRAFT  ·  PHASE 1
          </div>
        </div>
      </div>

      {/* Split layout: chat on left, context on right */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 28, alignItems: 'start' }}>
        <ConversationPane voiceActive={voiceActive} setVoiceActive={setVoiceActive} inputText={inputText} setInputText={setInputText} />
        <ContextPane />
      </div>
    </div>
  );
}

function ConversationPane({ voiceActive, setVoiceActive, inputText, setInputText }) {
  return (
    <div>
      {/* Conversation stream */}
      <div style={{ marginBottom: 20 }}>
        <ChatBubble role="opus" time="12:14">
          Let's start with what you think is mispriced. You said this is about AI eating labour cost
          in insurance — is the unpriced thing the margin expansion itself, or the multiple re-rate
          that follows once the market reframes these as software-margin businesses?
        </ChatBubble>

        <ChatBubble role="user" time="12:16">
          The re-rate. The market sees this as an earnings story — modest combined-ratio improvement,
          a couple of years of EPS beats. I think it's a sector identity shift. Once Berkshire's GEICO
          or Progressive show 80-ish combined ratios consistently, the multiple gets re-anchored against
          software, not financials.
        </ChatBubble>

        <DataFetchEvent text="Checking IG insurer combined ratios via Massive" detail="CB 88.4 · TRV 91.2 · ALL 93.1 · PGR 86.7" time="12:16" />

        <ChatBubble role="opus" time="12:17">
          That spread between best (PGR 86.7) and worst (ALL 93.1) is interesting — six points of
          combined-ratio dispersion in a sector that's supposed to be commoditised. If AI compresses
          claims-handling labour first, the early movers widen that spread before peers catch up. Worth
          watching whether PGR's already-low ratio is the visible edge of that, or just historical
          underwriting quality. What's your prior — is PGR ahead, or just lucky on mix?
        </ChatBubble>

        <ChatBubble role="user" time="12:19">
          Ahead. Their telematics build was the early move; their claims-AI work is the second wave.
          But CB and TRV have more room to fall from 88-91 to 82-83 than PGR has from 87. Asymmetry's
          better in the laggards.
        </ChatBubble>

        <DataFetchEvent text="Checking IG insurer P/B multiples" detail="CB 1.7× · TRV 1.5× · ALL 1.4× · PGR 5.8×" time="12:19" />

        <ChatBubble role="opus" time="12:20">
          P/B confirms — PGR already trades at software-ish 5.8×, CB and TRV at 1.4-1.7×. If the re-rate
          thesis fires, that's where the slack is. Now the harder question: what's the leading indicator
          that confirms this is happening vs. cyclical underwriting tailwinds? You'll want a kill-trigger
          on the wrong-answer case before we move forward.
        </ChatBubble>
      </div>

      {/* Input area */}
      <div style={{ border: `1px solid ${C.line}`, background: C.panel, padding: '14px 16px', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <textarea
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder={voiceActive ? 'Listening…' : 'Reply to Opus…'}
            rows={2}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none', resize: 'none',
              color: C.text, fontFamily: 'Fraunces, serif', fontSize: 14.5, lineHeight: 1.5,
            }}
          />
          <VoiceButton active={voiceActive} onToggle={() => setVoiceActive(v => !v)} />
        </div>
      </div>

      {/* Ready for review CTA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <span className="mono" style={{ fontSize: 10.5, color: C.faint, letterSpacing: '0.06em' }}>
          OPUS · PHASE 1   ·   STILL DEVELOPING — TRIGGERS + DOWNSIDE NOT YET COVERED
        </span>
        <button style={{
          background: 'transparent', border: `1px solid ${C.chime}`, color: C.chime,
          padding: '8px 18px', cursor: 'pointer',
          fontFamily: 'JetBrains Mono', fontSize: 10, letterSpacing: '0.16em',
          textTransform: 'uppercase',
        }}>
          Ready for review →
        </button>
      </div>
    </div>
  );
}

function ChatBubble({ role, time, children }) {
  const isOpus = role === 'opus';
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
        <span className="label" style={{ color: isOpus ? C.chime : C.muted }}>
          {isOpus ? 'Opus' : 'You'}
        </span>
        <span className="mono" style={{ fontSize: 9.5, color: C.faint, letterSpacing: '0.06em' }}>{time}</span>
      </div>
      <div className="serif" style={{
        fontSize: 14.5, lineHeight: 1.6,
        color: isOpus ? C.body : C.text,
        paddingLeft: isOpus ? 0 : 14,
        borderLeft: isOpus ? 'none' : `1px solid ${C.line}`,
        maxWidth: '60ch',
      }}>
        {children}
      </div>
    </div>
  );
}

function DataFetchEvent({ text, detail, time }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', gap: 12, padding: '10px 14px',
      background: C.panel, border: `1px solid ${C.line}`, marginBottom: 20,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.chime, flexShrink: 0, alignSelf: 'center' }} />
      <div style={{ flex: 1 }}>
        <div className="mono" style={{ fontSize: 11, color: C.body, letterSpacing: '0.02em', marginBottom: 3 }}>{text}</div>
        <div className="mono nums" style={{ fontSize: 10.5, color: C.muted, letterSpacing: '0.04em' }}>{detail}</div>
      </div>
      <span className="mono" style={{ fontSize: 9.5, color: C.faint, letterSpacing: '0.06em' }}>{time}</span>
    </div>
  );
}

function VoiceButton({ active, onToggle }) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: 38, height: 38, borderRadius: 2,
        background: active ? C.chime : 'transparent',
        border: `1.5px solid ${active ? C.chime : C.line}`,
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 200ms ease',
        animation: active ? 'pulse-glow 1.4s ease-in-out infinite' : 'none',
        flexShrink: 0,
      }}
      title={active ? 'Tap to stop recording' : 'Tap to start recording'}
    >
      <svg width="14" height="18" viewBox="0 0 14 18" fill="none">
        <rect x="4" y="0.5" width="6" height="10" rx="3" stroke={active ? C.bg : C.muted} strokeWidth="1.5" />
        <path d="M1 8.5C1 11.8 3.7 14.5 7 14.5C10.3 14.5 13 11.8 13 8.5" stroke={active ? C.bg : C.muted} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="7" y1="14.5" x2="7" y2="17.5" stroke={active ? C.bg : C.muted} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </button>
  );
}

function ContextPane() {
  return (
    <div style={{ position: 'sticky', top: 24 }}>
      {/* Thesis emerging */}
      <div style={{ background: C.panel, border: `1px solid ${C.line}`, padding: '18px 18px 16px', marginBottom: 16 }}>
        <div className="label" style={{ color: C.text, marginBottom: 14, paddingBottom: 10, borderBottom: `1px solid ${C.line}` }}>
          Thesis emerging
        </div>
        <ContextField label="Sector"    value="Financials × AI" />
        <ContextField label="Cycle"     value="mid-cycle" color={C.amber} />
        <ContextField label="Conviction" value="(pending)" muted />
        <ContextField label="Timing"    value="12–24 month re-rate" />
        <ContextField label="Hedge"     value="(not yet covered)" muted />
      </div>

      {/* Tickers identified */}
      <div style={{ background: C.panel, border: `1px solid ${C.line}`, padding: '18px 18px 16px', marginBottom: 16 }}>
        <div className="label" style={{ color: C.text, marginBottom: 14, paddingBottom: 10, borderBottom: `1px solid ${C.line}` }}>
          Tickers · live
        </div>
        <TickerRow ticker="CB"  name="Chubb"      price="258.40" change="+0.4%" up />
        <TickerRow ticker="TRV" name="Travelers"  price="189.20" change="-0.2%" />
        <TickerRow ticker="ALL" name="Allstate"   price="172.85" change="+0.1%" up />
        <TickerRow ticker="PGR" name="Progressive" price="248.10" change="+0.8%" up />
      </div>

      {/* Recent fetches */}
      <div style={{ background: C.panel, border: `1px solid ${C.line}`, padding: '18px 18px 16px' }}>
        <div className="label" style={{ color: C.text, marginBottom: 14, paddingBottom: 10, borderBottom: `1px solid ${C.line}` }}>
          Recent fetches
        </div>
        <FetchRow time="12:19" text="IG insurer P/B multiples" />
        <FetchRow time="12:16" text="IG insurer combined ratios" />
        <FetchRow time="12:14" text="Sector universe scan" />
      </div>
    </div>
  );
}

function ContextField({ label, value, color, muted }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      padding: '8px 0', borderBottom: `1px solid ${C.line}`,
    }}>
      <span className="label" style={{ color: C.faint }}>{label}</span>
      <span className="mono" style={{ fontSize: 11.5, color: muted ? C.faint : (color || C.text), letterSpacing: '0.02em' }}>
        {value}
      </span>
    </div>
  );
}

function TickerRow({ ticker, name, price, change, up }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr auto', gap: 8, padding: '8px 0', borderBottom: `1px solid ${C.line}`, alignItems: 'baseline' }}>
      <span className="mono" style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{ticker}</span>
      <span className="sans" style={{ fontSize: 10.5, color: C.muted }}>{name}</span>
      <div style={{ textAlign: 'right' }}>
        <div className="mono nums" style={{ fontSize: 11.5, color: C.text }}>${price}</div>
        <div className="mono nums" style={{ fontSize: 9.5, color: up ? C.sage : C.terracotta, marginTop: 1 }}>{change}</div>
      </div>
    </div>
  );
}

function FetchRow({ time, text }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${C.line}` }}>
      <span className="serif" style={{ fontSize: 12.5, color: C.body, fontStyle: 'italic' }}>{text}</span>
      <span className="mono" style={{ fontSize: 9.5, color: C.faint, letterSpacing: '0.06em' }}>{time}</span>
    </div>
  );
}

// ============================================================================
// WATCH MODE
// ============================================================================
const watchTheses = [
  {
    id: 'grid', name: 'Grid Resilience', cycleStage: 'secular', inPortfolio: true,
    conviction: 80, convictionDelta: +8, gamma: 'rising',
    triggers: { armed: 4, fired: 0, killArmed: 1 },
    lastUpdate: '22 May 2026',
    triggersDetail: [
      { type: 'kill',         desc: 'Hyperscaler capex deceleration', signal: 'NVDA/MSFT capex YoY', threshold: '< +15%', status: 'armed' },
      { type: 'confirming',   desc: 'Eaton order book extension',     signal: 'ETN backlog',          threshold: '> $20bn',  status: 'armed' },
      { type: 'disconfirming',desc: 'PWR backlog softening',          signal: 'PWR Q backlog',       threshold: '< $30bn',  status: 'armed' },
      { type: 'action',       desc: 'Add to ETN on backlog beat',     signal: 'ETN backlog',          threshold: '> $22bn',  status: 'armed' },
    ],
  },
  {
    id: 'credit', name: 'Private Credit — Slow Burn', cycleStage: 'credit-cycle', inPortfolio: false,
    conviction: 78, convictionDelta: +6, gamma: 'rising',
    triggers: { armed: 3, fired: 1, killArmed: 1 },
    lastUpdate: '19 May 2026',
  },
  {
    id: 'silver', name: 'Silver Over Gold', cycleStage: 'long-cycle', inPortfolio: true,
    conviction: 76, convictionDelta: -2, gamma: 'flat',
    triggers: { armed: 3, fired: 0, killArmed: 1 },
    lastUpdate: '20 May 2026',
  },
  {
    id: 'solana', name: 'Solana — Agent Economy Settlement', cycleStage: 'secular', inPortfolio: true,
    conviction: 60, convictionDelta: -5, gamma: 'falling',
    triggers: { armed: 2, fired: 0, killArmed: 0 },
    lastUpdate: '15 May 2026',
  },
];

function WatchMode() {
  const [expanded, setExpanded] = useState('grid');

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <div className="label" style={{ color: C.muted, marginBottom: 6 }}>Active monitoring</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 12 }}>
          <h1 className="serif" style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-0.02em', color: C.text, margin: 0, lineHeight: 1.1 }}>
            Watch
          </h1>
          <div className="mono nums" style={{ fontSize: 10.5, color: C.faint, letterSpacing: '0.08em' }}>
            {watchTheses.length} ACTIVE · 1 TRIGGER FIRED
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 8, borderBottom: `1px solid ${C.line}`, paddingBottom: 14 }}>
        {['All','In portfolio','Triggers armed','Triggers fired','Kill-armed only'].map((f,i) => (
          <div key={f} className="label" style={{
            color: i === 0 ? C.text : C.muted,
            borderBottom: i === 0 ? `1px solid ${C.chime}` : '1px solid transparent',
            paddingBottom: 6, marginBottom: -15, cursor: 'default',
          }}>
            {f}
          </div>
        ))}
      </div>

      {/* Thesis rows */}
      {watchTheses.map(t => (
        <WatchRow
          key={t.id}
          t={t}
          expanded={expanded === t.id}
          onToggle={() => setExpanded(expanded === t.id ? null : t.id)}
        />
      ))}

      <p className="serif" style={{ fontSize: 13, fontStyle: 'italic', color: C.faint, marginTop: 32, lineHeight: 1.5, maxWidth: '60ch' }}>
        Click any thesis to expand its triggers. Once Wedgetail comes online, fired triggers will surface
        as notifications and draft commands; for now, this is the manual watchboard.
      </p>
    </div>
  );
}

function WatchRow({ t, expanded, onToggle }) {
  const convColor = convictionColor(t.conviction);
  const cycColor = cycleColor(t.cycleStage);

  return (
    <div style={{ borderBottom: `1px solid ${C.line}` }}>
      <div
        onClick={onToggle}
        className="hairline-row"
        style={{
          display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 24,
          padding: '22px 4px', alignItems: 'center', cursor: 'pointer',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
            <h3 className="serif" style={{ fontSize: 20, fontWeight: 600, color: C.text, margin: 0, letterSpacing: '-0.01em' }}>
              {t.name}
            </h3>
            {t.inPortfolio && (
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.chime, boxShadow: `0 0 6px ${C.chime}aa` }} />
            )}
          </div>
          <div style={{ display: 'flex', gap: 14, marginBottom: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="label" style={{ color: cycColor }}>{t.cycleStage.replace('-',' ')}</span>
            <span className="mono" style={{ fontSize: 10, color: C.faint, letterSpacing: '0.06em' }}>UPDATED {t.lastUpdate.toUpperCase()}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <TriggerPill type="armed" count={t.triggers.armed} label="armed" />
            {t.triggers.fired > 0 && <TriggerPill type="fired" count={t.triggers.fired} label="fired" />}
            {t.triggers.killArmed > 0 && <TriggerPill type="kill" count={t.triggers.killArmed} label="kill-armed" />}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div className="label" style={{ color: C.faint, marginBottom: 4 }}>Gamma</div>
          <GammaArrow direction={t.gamma} />
        </div>

        <div style={{ textAlign: 'right', minWidth: 80 }}>
          <div className="mono nums" style={{ fontSize: 32, fontWeight: 700, color: convColor, lineHeight: 1 }}>
            {t.conviction}
          </div>
          <div className="mono nums" style={{ fontSize: 10, color: t.convictionDelta > 0 ? C.sage : t.convictionDelta < 0 ? C.terracotta : C.faint, marginTop: 4, letterSpacing: '0.04em' }}>
            {t.convictionDelta > 0 ? '+' : ''}{t.convictionDelta} · 3MO
          </div>
        </div>
      </div>

      {/* Expanded: triggers list */}
      {expanded && t.triggersDetail && (
        <div style={{ padding: '8px 0 28px', background: C.panel }}>
          <div className="label" style={{ color: C.faint, padding: '14px 16px 10px', borderTop: `1px solid ${C.line}` }}>
            Triggers · per thesis
          </div>
          {t.triggersDetail.map((tr, i) => (
            <TriggerDetailRow key={i} tr={tr} />
          ))}
        </div>
      )}
    </div>
  );
}

function TriggerPill({ type, count, label }) {
  const color = type === 'fired' ? C.terracotta : type === 'kill' ? C.terracotta : C.muted;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 8px',
      border: `1px solid ${color}40`,
      background: type === 'fired' || type === 'kill' ? `${color}10` : 'transparent',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color }} />
      <span className="mono" style={{ fontSize: 9.5, color: type === 'fired' || type === 'kill' ? color : C.muted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {count} {label}
      </span>
    </span>
  );
}

function GammaArrow({ direction }) {
  const color = direction === 'rising' ? C.sage : direction === 'falling' ? C.terracotta : C.faint;
  const symbol = direction === 'rising' ? '↑' : direction === 'falling' ? '↓' : '→';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
      <span className="mono nums" style={{ fontSize: 22, color, lineHeight: 1, fontWeight: 600 }}>{symbol}</span>
      <span className="mono" style={{ fontSize: 10, color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{direction}</span>
    </div>
  );
}

function TriggerDetailRow({ tr }) {
  const typeColor = {
    confirming:   C.confirming,
    disconfirming:C.disconfirming,
    kill:         C.kill,
    action:       C.action,
  }[tr.type] || C.muted;

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '90px 1fr auto',
      gap: 16, padding: '12px 16px', borderTop: `1px solid ${C.line}`, alignItems: 'baseline',
    }}>
      <span className="label" style={{ color: typeColor }}>{tr.type}</span>
      <div>
        <div className="serif" style={{ fontSize: 13.5, color: C.body, marginBottom: 4 }}>{tr.desc}</div>
        <div className="mono" style={{ fontSize: 10.5, color: C.muted, letterSpacing: '0.03em' }}>
          {tr.signal} · {tr.threshold}
        </div>
      </div>
      <span className="label" style={{ color: tr.status === 'fired' ? C.terracotta : C.faint }}>{tr.status}</span>
    </div>
  );
}

// ============================================================================
// PORTFOLIO MODE
// ============================================================================
const portfolioTheses = [
  { id: 'grid',      name: 'Grid Resilience',          weight: 14, cycleStage: 'secular',         conviction: 80, positions: [
    { ticker: 'PWR',   weight: 4.2, name: 'Quanta Services' },
    { ticker: 'ETN',   weight: 3.4, name: 'Eaton' },
    { ticker: 'PRYMF', weight: 2.8, name: 'Prysmian' },
    { ticker: 'SHLS',  weight: 2.1, name: 'Shoals' },
    { ticker: 'ENS',   weight: 1.5, name: 'EnerSys' },
  ]},
  { id: 'silver',    name: 'Silver Over Gold',         weight: 12, cycleStage: 'long-cycle',      conviction: 76, positions: [
    { ticker: 'SIVR',  weight: 5.0, name: 'Aberdeen Phys Silver' },
    { ticker: 'PAAS',  weight: 4.0, name: 'Pan American Silver' },
    { ticker: 'WPM',   weight: 3.0, name: 'Wheaton Precious Metals' },
  ]},
  { id: 'agentequity', name: 'Agent Economy — Equity Layer', weight: 11, cycleStage: 'secular',   conviction: 63, positions: [
    { ticker: 'NET',   weight: 2.2, name: 'Cloudflare' },
    { ticker: 'V',     weight: 2.0, name: 'Visa' },
    { ticker: 'OKTA',  weight: 1.8, name: 'Okta' },
    { ticker: 'MA',    weight: 2.0, name: 'Mastercard' },
    { ticker: 'PYPL',  weight: 1.5, name: 'PayPal' },
    { ticker: 'SHOP',  weight: 1.5, name: 'Shopify' },
  ]},
  { id: 'solana',    name: 'Solana — Agent Economy',   weight:  8, cycleStage: 'secular',         conviction: 60, positions: [
    { ticker: 'BSOL',  weight: 4.0, name: 'Bitwise Solana Staking ETF' },
    { ticker: 'FORD',  weight: 2.5, name: 'Forward Industries' },
    { ticker: 'FSOL',  weight: 1.5, name: 'Sol Strategies' },
  ]},
  { id: 'aaa',       name: 'AAA Collapse / Platform Compound', weight: 7, cycleStage: 'narrative-cycle', conviction: 65, positions: [
    { ticker: 'RBLX',  weight: 4.0, name: 'Roblox' },
    { ticker: 'TTWO',  weight: 1.5, name: 'Take-Two' },
    { ticker: 'EA',    weight: 1.5, name: 'Electronic Arts' },
  ]},
];

const correlationClusters = [
  { name: 'AI capex exposure',   pct: 21, theses: ['Grid Resilience', 'Agent Equity Layer', 'Insurance AI'] },
  { name: 'Physical commodities', pct: 16, theses: ['Silver Over Gold', 'Uranium (deferred)'] },
  { name: 'AU/AUD currency',      pct: 9,  theses: ['Copper', 'Retirement Villages', 'ASX uranium'] },
];

function PortfolioMode() {
  const totalAllocated = portfolioTheses.reduce((s, t) => s + t.weight, 0);
  const cash = 100 - totalAllocated;

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <div className="label" style={{ color: C.muted, marginBottom: 6 }}>Target allocation · ideation, not live state</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 12 }}>
          <h1 className="serif" style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-0.02em', color: C.text, margin: 0, lineHeight: 1.1 }}>
            Portfolio
          </h1>
          <div className="mono nums" style={{ fontSize: 10.5, color: C.faint, letterSpacing: '0.08em' }}>
            {portfolioTheses.length} THESES · {totalAllocated}% ALLOCATED · {cash}% CASH
          </div>
        </div>
      </div>

      {/* Note: this is ideation */}
      <p className="serif" style={{ fontSize: 13.5, fontStyle: 'italic', color: C.muted, marginBottom: 36, lineHeight: 1.55, maxWidth: '62ch' }}>
        These are target weights — how the book should be sized if conviction translated cleanly to NAV.
        Live portfolio state, execution, and rebalancing belong to Wedgetail.
      </p>

      {/* View tabs */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 24, paddingBottom: 14, borderBottom: `1px solid ${C.line}` }}>
        {['By thesis','By sector','By cycle stage'].map((v,i) => (
          <div key={v} className="label" style={{
            color: i === 0 ? C.chime : C.muted,
            borderBottom: i === 0 ? `1px solid ${C.chime}` : '1px solid transparent',
            paddingBottom: 6, marginBottom: -15, cursor: 'default',
          }}>
            {v}
          </div>
        ))}
      </div>

      {/* Allocation bar */}
      <Section label="Allocation · by thesis" right={`${totalAllocated}% deployed`}>
        <AllocationBar theses={portfolioTheses} cash={cash} />
        <div style={{ marginTop: 28 }}>
          {portfolioTheses.map(t => <AllocationRow key={t.id} t={t} />)}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr auto', gap: 24,
            padding: '14px 0', borderBottom: `1px solid ${C.line}`, alignItems: 'baseline',
          }}>
            <span className="serif" style={{ fontSize: 14, color: C.muted, fontStyle: 'italic' }}>Cash + opportunistic</span>
            <span className="mono nums" style={{ fontSize: 16, color: C.muted, fontWeight: 600 }}>{cash}%</span>
          </div>
        </div>
      </Section>

      {/* Positions roll-up */}
      <Section label="Positions · grouped by thesis">
        {portfolioTheses.map(t => <ThesisPositionsBlock key={t.id} t={t} />)}
      </Section>

      {/* Correlation clusters */}
      <Section label="Correlation clusters" right="Cross-thesis exposure">
        {correlationClusters.map((c, i) => <CorrelationRow key={i} c={c} />)}
        <p className="serif" style={{ fontSize: 13, fontStyle: 'italic', color: C.faint, marginTop: 16, lineHeight: 1.55, maxWidth: '62ch' }}>
          Clusters reveal where the same risk shows up multiple places. AI capex exposure spans Grid
          Resilience, Agent Equity Layer, and Insurance AI — three independent theses, one common
          underlying. Sizing decisions made one thesis at a time can compound exposure unintentionally.
        </p>
      </Section>
    </div>
  );
}

function AllocationBar({ theses, cash }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', height: 32, border: `1px solid ${C.line}`, overflow: 'hidden' }}>
        {theses.map(t => (
          <div key={t.id} title={`${t.name}: ${t.weight}%`} style={{
            width: `${t.weight}%`,
            background: cycleColor(t.cycleStage),
            opacity: 0.85,
            borderRight: `1px solid ${C.bg}`,
          }} />
        ))}
        <div title={`Cash: ${cash}%`} style={{
          width: `${cash}%`,
          background: C.hairline,
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <span className="mono" style={{ fontSize: 9.5, color: C.faint, letterSpacing: '0.06em' }}>0%</span>
        <span className="mono" style={{ fontSize: 9.5, color: C.faint, letterSpacing: '0.06em' }}>50%</span>
        <span className="mono" style={{ fontSize: 9.5, color: C.faint, letterSpacing: '0.06em' }}>100%</span>
      </div>
    </div>
  );
}

function AllocationRow({ t }) {
  const cycColor = cycleColor(t.cycleStage);
  const convColor = convictionColor(t.conviction);
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '12px 1fr auto auto', gap: 16,
      padding: '12px 0', borderBottom: `1px solid ${C.line}`, alignItems: 'baseline',
    }}>
      <div style={{ width: 8, height: 8, background: cycColor, alignSelf: 'center' }} />
      <span className="serif" style={{ fontSize: 14.5, color: C.body }}>{t.name}</span>
      <span className="mono nums" style={{ fontSize: 10, color: convColor, letterSpacing: '0.06em' }}>{t.conviction} CONV</span>
      <span className="mono nums" style={{ fontSize: 14, color: C.text, fontWeight: 600, textAlign: 'right', minWidth: 36 }}>{t.weight}%</span>
    </div>
  );
}

function ThesisPositionsBlock({ t }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        marginBottom: 10, paddingBottom: 8, borderBottom: `1px solid ${C.line}`,
      }}>
        <span className="serif" style={{ fontSize: 16, fontWeight: 600, color: C.text }}>{t.name}</span>
        <span className="mono nums" style={{ fontSize: 11, color: C.muted, letterSpacing: '0.04em' }}>{t.weight}% OF NAV</span>
      </div>
      {t.positions.map((p, i) => (
        <div key={i} style={{
          display: 'grid', gridTemplateColumns: '60px 1fr auto', gap: 16,
          padding: '8px 0', borderBottom: `1px solid ${C.line}`, alignItems: 'baseline',
        }}>
          <span className="mono" style={{ fontSize: 12.5, fontWeight: 600, color: C.text }}>{p.ticker}</span>
          <span className="sans" style={{ fontSize: 12, color: C.muted }}>{p.name}</span>
          <span className="mono nums" style={{ fontSize: 12, color: C.text }}>{p.weight}%</span>
        </div>
      ))}
    </div>
  );
}

function CorrelationRow({ c }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr auto', gap: 24,
      padding: '16px 0', borderBottom: `1px solid ${C.line}`, alignItems: 'baseline',
    }}>
      <div>
        <div className="serif" style={{ fontSize: 14.5, color: C.body, marginBottom: 4 }}>{c.name}</div>
        <div className="mono" style={{ fontSize: 10.5, color: C.muted, letterSpacing: '0.04em' }}>
          {c.theses.join(' · ')}
        </div>
      </div>
      <div className="mono nums" style={{ fontSize: 18, color: c.pct >= 18 ? C.terracotta : C.amber, fontWeight: 700 }}>
        {c.pct}%
      </div>
    </div>
  );
}
