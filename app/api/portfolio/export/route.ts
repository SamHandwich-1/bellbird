import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// CSV export of all trades. Auth-gated. RFC 4180 escaping (quotes around any
// field containing comma / quote / newline; embedded quotes doubled).
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse('Unauthorized', { status: 401 });

  const { data: trades, error } = await supabase
    .from('trades')
    .select('executed_at, ticker, side, quantity, price, fees, currency, thesis_id, notes')
    .order('executed_at', { ascending: true });
  if (error) return new NextResponse(error.message, { status: 500 });

  const headers = [
    'executed_at',
    'ticker',
    'side',
    'quantity',
    'price',
    'fees',
    'currency',
    'thesis_id',
    'notes',
  ];

  function csvEscape(v: unknown): string {
    if (v == null) return '';
    const s = typeof v === 'string' ? v : String(v);
    if (/[,"\r\n]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }

  const rows = (trades ?? []).map((t) =>
    [
      t.executed_at,
      t.ticker,
      t.side,
      t.quantity,
      t.price,
      t.fees,
      t.currency,
      t.thesis_id,
      t.notes,
    ]
      .map(csvEscape)
      .join(','),
  );

  const csv = [headers.join(','), ...rows].join('\r\n') + '\r\n';

  const today = new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, '');

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="bellbird-trades-${today}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
