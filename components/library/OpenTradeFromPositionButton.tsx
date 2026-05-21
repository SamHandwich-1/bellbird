import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { tokens } from '@/lib/tokens';
import type { Position } from '@/lib/types';

// Per-position deep-link to /portfolio with prefill query params. RSC, no
// state, no JS shipped for the button. NewTradeButton on /portfolio auto-opens
// the TradeEntryModal when prefill_* params are present.
export function OpenTradeFromPositionButton({ position }: { position: Position }) {
  const params = new URLSearchParams();
  params.set('prefill_ticker', position.ticker);
  if (position.thesis_id) params.set('prefill_thesis_id', position.thesis_id);

  return (
    <Link
      href={`/portfolio?${params.toString()}`}
      className="btn-quiet inline-flex items-center"
      style={{ color: tokens.whisper }}
      aria-label={`Open trade for ${position.ticker}`}
      title="Open trade"
    >
      <ArrowUpRight size={12} strokeWidth={1.5} />
    </Link>
  );
}
