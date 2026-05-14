import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { tokens } from '@/lib/tokens';

export function IdentityScreen() {
  return (
    <div className="pt-16 sm:pt-24">
      {/* Hero */}
      <div className="mb-24">
        <div
          className="font-sans text-[10px] tracking-[0.22em] uppercase mb-6"
          style={{ color: tokens.whisper }}
        >
          A clear note in the noise
        </div>
        <h1
          className="font-serif text-[88px] sm:text-[120px] leading-[0.95] tracking-tight"
          style={{ fontWeight: 320 }}
        >
          Bellbird
        </h1>
        <div className="mt-8 max-w-[58ch]">
          <p
            className="font-serif text-[22px] leading-[1.45]"
            style={{ fontWeight: 340, color: tokens.ash }}
          >
            Named for the bell-like call that cuts through the bush. A workspace
            for developing investment theses with deliberation — research, stress-test,
            watch, attribute. Upstream of Wedgetail&rsquo;s monitoring, upstream of
            Bowerbird&rsquo;s decisions. Where ideas are born and refined before they
            enter the system.
          </p>
        </div>

        <div className="mt-12 flex items-center gap-8 flex-wrap">
          <Link
            href="/library"
            className="font-sans text-[11px] tracking-[0.22em] uppercase btn-quiet flex items-center gap-2"
            style={{
              color: tokens.ink,
              borderBottom: `1px solid ${tokens.ink}`,
              paddingBottom: 4,
            }}
          >
            Enter library <ArrowUpRight size={12} strokeWidth={1.5} />
          </Link>
          <Link
            href="/develop"
            className="font-sans text-[11px] tracking-[0.22em] uppercase btn-quiet"
            style={{ color: tokens.whisper }}
          >
            Begin a conversation
          </Link>
        </div>
      </div>

      <div className="hairline mb-16" />

      {/* The three birds */}
      <section className="mb-24">
        <div
          className="font-sans text-[10px] tracking-[0.22em] uppercase mb-8"
          style={{ color: tokens.whisper }}
        >
          The three birds
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
          <BirdCard
            name="Bellbird"
            role="Ideation"
            body="Develops and refines theses with structured deliberation. Curates the watchlist. Stress-tests against contrarian models. Surfaces cross-thesis patterns."
            current
          />
          <BirdCard
            name="Wedgetail"
            role="Surveillance"
            body="Watches markets ambient and continuously. Surfaces triggers. Tracks calendar events, earnings, economic data. Reports back to Bellbird when something Bellbird is watching for arrives."
          />
          <BirdCard
            name="Bowerbird"
            role="Decision infrastructure"
            body="The long-arc platform. Ingests theses from Bellbird, signals from Wedgetail. Runs decision engine, memory, fragility monitor, pair-trade discovery."
          />
        </div>
      </section>

      <div className="hairline mb-16" />

      {/* Palette */}
      <section className="mb-24">
        <div
          className="font-sans text-[10px] tracking-[0.22em] uppercase mb-8"
          style={{ color: tokens.whisper }}
        >
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
        <div
          className="font-sans text-[10px] tracking-[0.22em] uppercase mb-8"
          style={{ color: tokens.whisper }}
        >
          Typography
        </div>
        <div className="space-y-8">
          <div>
            <div
              className="font-sans text-[10px] tracking-[0.16em] uppercase mb-2"
              style={{ color: tokens.whisper }}
            >
              Display — Fraunces
            </div>
            <div
              className="font-serif text-[56px] leading-[1.05] tracking-tight"
              style={{ fontWeight: 320 }}
            >
              The note before the score.
            </div>
          </div>
          <div>
            <div
              className="font-sans text-[10px] tracking-[0.16em] uppercase mb-2"
              style={{ color: tokens.whisper }}
            >
              Body — Manrope
            </div>
            <p className="font-sans text-[15px] leading-[1.7] max-w-[58ch]">
              Each thesis carries an unpriced second-order effect, a cycle classification,
              a watch list of triggers, and a thread of conversation that developed it.
              The library is the artefact of disciplined thinking — not a dashboard, not
              a feed. A collection of considered ideas, arranged.
            </p>
          </div>
          <div>
            <div
              className="font-sans text-[10px] tracking-[0.16em] uppercase mb-2"
              style={{ color: tokens.whisper }}
            >
              Numbers — JetBrains Mono
            </div>
            <div className="font-mono nums text-[20px]">
              +25.4%   80%   $12,840.50   2026-06-08
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function BirdCard({
  name,
  role,
  body,
  current,
}: {
  name: string;
  role: string;
  body: string;
  current?: boolean;
}) {
  return (
    <div
      className="p-6"
      style={{
        background: current ? tokens.mist : 'transparent',
        border: current ? 'none' : `1px solid ${tokens.hairline}`,
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: current ? tokens.chime : tokens.whisper,
          }}
        />
        <div
          className="font-sans text-[10px] tracking-[0.22em] uppercase"
          style={{ color: tokens.whisper }}
        >
          {role}
        </div>
      </div>
      <div
        className="font-serif text-[26px] tracking-tight mb-3"
        style={{ fontWeight: 380 }}
      >
        {name}
      </div>
      <p
        className="font-sans text-[13px] leading-[1.65]"
        style={{ color: tokens.ash }}
      >
        {body}
      </p>
      {current && (
        <div
          className="mt-4 font-sans text-[10px] tracking-[0.22em] uppercase"
          style={{ color: tokens.chime }}
        >
          You are here
        </div>
      )}
    </div>
  );
}

function Swatch({ color, name, note }: { color: string; name: string; note: string }) {
  return (
    <div>
      <div
        style={{
          background: color,
          height: 80,
          border: `1px solid ${tokens.hairline}`,
        }}
      />
      <div className="mt-2 font-sans text-[11px]" style={{ color: tokens.ink }}>
        {name}
      </div>
      <div className="font-mono text-[10px]" style={{ color: tokens.whisper }}>
        {color}
      </div>
      <div
        className="font-sans text-[10px] mt-0.5"
        style={{ color: tokens.whisper }}
      >
        {note}
      </div>
    </div>
  );
}
