import Link from 'next/link';
import { tokens } from '@/lib/tokens';
import { createClient } from '@/lib/supabase/server';
import { Section } from '@/components/shared/Section';

const LAST_EDITED = '25 MAY 2026';

const LENSES = [
  { name: 'Marks',      role: 'Second-level thinking · asymmetry over directional bets' },
  { name: 'Mauboussin', role: "Expectations gap · what's priced vs what's likely" },
  { name: 'Munger',     role: 'Inversion · what would kill this?' },
  { name: 'Klarman',    role: 'Permanent loss as the only real risk' },
  { name: 'Buffett',    role: 'Circle of competence · four-sentence thesis test' },
];

const ENGAGED = [
  'Industrial commodities (Cu, Ag, U)',
  'AI infrastructure equities',
  'Credit cycle dynamics',
  'Japan financials',
  'Macro / cycles',
  'Solana ecosystem',
];

const AVOIDED = [
  'Biotech (binary outcomes)',
  'Crypto altcoins (no edge)',
  'Single-stock options',
  'China A-shares',
  'Emerging-market sovereign debt',
];

const BIASES = [
  {
    bias: 'Strong negative prior on Meta',
    counter: 'Counterweight with rigorous valuation work; quote source figures, not impressions',
  },
  {
    bias: 'Education-sector bias from prior career',
    counter: 'Let data lead. Apply equal scepticism to thesis and anti-thesis',
  },
  {
    bias: 'Recency bias on AI capex narrative',
    counter: 'Discipline via historical analogs — every AI thesis tested against the 1999 tech-capex analog',
  },
];

type ServiceStatusType = 'connected' | 'planned';

const SERVICES: { name: string; sub: string; status: ServiceStatusType }[] = [
  { name: 'Massive',              sub: 'Markets · ex-Polygon',          status: 'connected' },
  { name: 'FRED',                 sub: 'Macro · St. Louis Fed',         status: 'connected' },
  { name: 'OpenAI Whisper',       sub: 'Voice input · Develop chat',    status: 'planned' },
  { name: 'NBER recession dates', sub: 'Cycles · History',              status: 'connected' },
  { name: 'Wedgetail',            sub: 'Portfolio state · planned integration', status: 'planned' },
];

const SETTINGS = [
  { label: 'Voice input',                 value: 'Toggle · tap to start / tap to stop' },
  { label: 'Default sub-tab on Cycles',   value: 'Now' },
  { label: 'Develop autosave',            value: 'On · every message' },
  { label: 'Trigger notifications',       value: 'Off · deferred to Wedgetail' },
];

export async function IdentityScreen() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 36 }}>
        <div className="label" style={{ color: tokens.muted, marginBottom: 6 }}>
          Investor profile
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
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
            Identity
          </h1>
          <div
            className="mono nums"
            style={{ fontSize: 10.5, color: tokens.faint, letterSpacing: '0.08em' }}
          >
            LAST EDITED · {LAST_EDITED}
          </div>
        </div>
      </div>

      <Section label="The investor">
        <p
          className="serif"
          style={{
            fontSize: 16,
            lineHeight: 1.65,
            color: tokens.body,
            margin: 0,
            maxWidth: '62ch',
          }}
        >
          Melbourne-based investor focused on non-consensus, second-order trades. Bellbird is the
          workspace for theses that require expectations-gap discipline and downside-first survival
          testing. Targets unpriced second-order effects rather than directional macro calls.
          Wedgetail handles live portfolio state, trigger automation, and draft execution.
        </p>
      </Section>

      <Section label="The lens" right="Behavioural frameworks">
        {LENSES.map((l) => (
          <PrincipleRow key={l.name} name={l.name} role={l.role} />
        ))}
        <p
          className="serif"
          style={{
            fontSize: 13,
            fontStyle: 'italic',
            color: tokens.faint,
            margin: '14px 0 0',
            maxWidth: '60ch',
          }}
        >
          These lenses are encoded behaviourally in the Develop pipeline — one primary lens per
          phase, never stacked. Frameworks shape questions; they don&rsquo;t get named in prompts.
        </p>
      </Section>

      <Section label="Circle of competence">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          <div>
            <div className="label" style={{ color: tokens.sage, marginBottom: 12 }}>
              Engaged
            </div>
            {ENGAGED.map((t) => (
              <CompetenceItem key={t} text={t} />
            ))}
          </div>
          <div>
            <div className="label" style={{ color: tokens.terracotta, marginBottom: 12 }}>
              Avoided
            </div>
            {AVOIDED.map((t) => (
              <CompetenceItem key={t} text={t} muted />
            ))}
          </div>
        </div>
      </Section>

      <Section label="Biases to counterbalance" right="Self-declared">
        {BIASES.map((b) => (
          <BiasRow key={b.bias} bias={b.bias} counter={b.counter} />
        ))}
      </Section>

      <Section label="Data connections" right="Status · live">
        {SERVICES.map((s) => (
          <ServiceStatus key={s.name} name={s.name} sub={s.sub} status={s.status} />
        ))}
      </Section>

      <Section label="Settings" dense>
        {SETTINGS.map((s) => (
          <SettingRow key={s.label} label={s.label} value={s.value} />
        ))}
        <AuthRow userEmail={user?.email ?? null} />
      </Section>
    </div>
  );
}

function PrincipleRow({ name, role }: { name: string; role: string }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '120px 1fr',
        gap: 24,
        padding: '14px 0',
        borderBottom: `1px solid ${tokens.line}`,
        alignItems: 'baseline',
      }}
    >
      <div
        className="serif"
        style={{
          fontSize: 17,
          fontWeight: 600,
          color: tokens.text,
          letterSpacing: '-0.01em',
        }}
      >
        {name}
      </div>
      <div className="serif" style={{ fontSize: 14, color: tokens.body, lineHeight: 1.5 }}>
        {role}
      </div>
    </div>
  );
}

function CompetenceItem({ text, muted = false }: { text: string; muted?: boolean }) {
  return (
    <div style={{ padding: '8px 0', borderBottom: `1px solid ${tokens.line}` }}>
      <span
        className="serif"
        style={{
          fontSize: 14,
          color: muted ? tokens.muted : tokens.body,
          lineHeight: 1.5,
        }}
      >
        {text}
      </span>
    </div>
  );
}

function BiasRow({ bias, counter }: { bias: string; counter: string }) {
  return (
    <div style={{ padding: '16px 0', borderBottom: `1px solid ${tokens.line}` }}>
      <div className="serif" style={{ fontSize: 14.5, color: tokens.body, marginBottom: 6 }}>
        {bias}
      </div>
      <div
        className="serif"
        style={{
          fontSize: 13,
          fontStyle: 'italic',
          color: tokens.muted,
          maxWidth: '62ch',
          lineHeight: 1.55,
        }}
      >
        <span className="label" style={{ color: tokens.chime, marginRight: 8 }}>
          Counter
        </span>
        {counter}
      </div>
    </div>
  );
}

function ServiceStatus({
  name,
  sub,
  status,
}: {
  name: string;
  sub: string;
  status: ServiceStatusType;
}) {
  const statusColor = status === 'connected' ? tokens.sage : tokens.faint;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto auto',
        gap: 24,
        padding: '14px 0',
        borderBottom: `1px solid ${tokens.line}`,
        alignItems: 'baseline',
      }}
    >
      <div>
        <div
          className="serif"
          style={{ fontSize: 15, color: tokens.text, fontWeight: 500 }}
        >
          {name}
        </div>
        <div
          className="mono"
          style={{
            fontSize: 10.5,
            color: tokens.faint,
            marginTop: 3,
            letterSpacing: '0.03em',
          }}
        >
          {sub}
        </div>
      </div>
      <div
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: statusColor,
          boxShadow: status === 'connected' ? `0 0 6px ${statusColor}99` : 'none',
          alignSelf: 'center',
        }}
      />
      <span className="label" style={{ color: statusColor }}>
        {status}
      </span>
    </div>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        padding: '12px 0',
        borderBottom: `1px solid ${tokens.line}`,
      }}
    >
      <span className="serif" style={{ fontSize: 14, color: tokens.body }}>
        {label}
      </span>
      <span
        className="mono"
        style={{ fontSize: 11.5, color: tokens.muted, letterSpacing: '0.03em' }}
      >
        {value}
      </span>
    </div>
  );
}

function AuthRow({ userEmail }: { userEmail: string | null }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        padding: '12px 0',
        borderBottom: `1px solid ${tokens.line}`,
      }}
    >
      <div>
        <div className="serif" style={{ fontSize: 14, color: tokens.body }}>
          Session
        </div>
        {userEmail && (
          <div
            className="mono"
            style={{
              fontSize: 10.5,
              color: tokens.faint,
              marginTop: 3,
              letterSpacing: '0.03em',
            }}
          >
            {userEmail}
          </div>
        )}
      </div>
      {userEmail ? (
        <form action="/auth/sign-out" method="post">
          <button
            type="submit"
            className="label btn-quiet"
            style={{
              background: 'transparent',
              border: 'none',
              color: tokens.chime,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Sign out
          </button>
        </form>
      ) : (
        <Link
          href="/login"
          className="label btn-quiet"
          style={{ color: tokens.chime, textDecoration: 'none' }}
        >
          Sign in
        </Link>
      )}
    </div>
  );
}
