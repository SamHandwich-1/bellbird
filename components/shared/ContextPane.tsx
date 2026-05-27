// Develop right-rail. Mockup: references/bellbird-mockup-v2-stack.jsx
//
// Per Turn B interview decision 2: all three cards render as pure UI chrome
// with empty-state copy. Live wiring (Tickers / Recent fetches) depends on
// item 6 and lands in a follow-up turn. "Thesis emerging" depends on Phase 2
// structured output that doesn't run until "Ready for review" fires — empty
// during Phase 1 by design.

import { tokens } from '@/lib/tokens';

export function ContextPane() {
  return (
    <div style={{ position: 'sticky', top: 24 }}>
      <Card title="Thesis emerging">
        <EmptyState>Populates after Phase 2 structuring. Sector, cycle, conviction, timing, and hedge land here when you mark the thesis ready for review.</EmptyState>
      </Card>

      <Card title="Tickers · live">
        <EmptyState>Live price wiring (Massive) is queued as a follow-up turn. When it lands, tickers surfaced in the conversation will appear here with current price and intraday change.</EmptyState>
      </Card>

      <Card title="Recent fetches">
        <EmptyState>Once live data fetching is wired, the data trail per conversation will appear here.</EmptyState>
      </Card>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: tokens.panel,
        border: `1px solid ${tokens.line}`,
        padding: '18px 18px 16px',
        marginBottom: 16,
      }}
    >
      <div
        className="label"
        style={{
          color: tokens.text,
          marginBottom: 14,
          paddingBottom: 10,
          borderBottom: `1px solid ${tokens.line}`,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="serif"
      style={{
        fontSize: 12.5,
        fontStyle: 'italic',
        color: tokens.faint,
        margin: 0,
        lineHeight: 1.55,
      }}
    >
      {children}
    </p>
  );
}

// Sub-components below ship for later wiring. Kept colocated so the
// follow-up turn just imports them, no reshuffling. They aren't rendered
// in Turn B.

export function ContextField({
  label,
  value,
  color,
  muted,
}: {
  label: string;
  value: string;
  color?: string;
  muted?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        padding: '8px 0',
        borderBottom: `1px solid ${tokens.line}`,
      }}
    >
      <span className="label" style={{ color: tokens.faint }}>
        {label}
      </span>
      <span
        className="mono"
        style={{
          fontSize: 11.5,
          color: muted ? tokens.faint : color || tokens.text,
          letterSpacing: '0.02em',
        }}
      >
        {value}
      </span>
    </div>
  );
}

export function TickerRow({
  ticker,
  name,
  price,
  change,
  up,
}: {
  ticker: string;
  name: string;
  price: string;
  change: string;
  up?: boolean;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '52px 1fr auto',
        gap: 8,
        padding: '8px 0',
        borderBottom: `1px solid ${tokens.line}`,
        alignItems: 'baseline',
      }}
    >
      <span className="mono" style={{ fontSize: 12, fontWeight: 600, color: tokens.text }}>
        {ticker}
      </span>
      <span className="sans" style={{ fontSize: 10.5, color: tokens.muted }}>
        {name}
      </span>
      <div style={{ textAlign: 'right' }}>
        <div className="mono nums" style={{ fontSize: 11.5, color: tokens.text }}>
          ${price}
        </div>
        <div
          className="mono nums"
          style={{
            fontSize: 9.5,
            color: up ? tokens.sage : tokens.terracotta,
            marginTop: 1,
          }}
        >
          {change}
        </div>
      </div>
    </div>
  );
}

export function FetchRow({ time, text }: { time: string; text: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '7px 0',
        borderBottom: `1px solid ${tokens.line}`,
      }}
    >
      <span
        className="serif"
        style={{ fontSize: 12.5, color: tokens.body, fontStyle: 'italic' }}
      >
        {text}
      </span>
      <span
        className="mono"
        style={{ fontSize: 9.5, color: tokens.faint, letterSpacing: '0.06em' }}
      >
        {time}
      </span>
    </div>
  );
}
