// One-time 30-year backfill. Run manually after the FRED_API_KEY is set and
// the schema is in place. Safe to re-run thanks to UPSERT semantics.
//
//   curl -H "Authorization: Bearer $CRON_SECRET" \
//        "https://bellbird-eta.vercel.app/api/macro/backfill?since=1995-01-01"

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { runRefresh } from '@/lib/fred/refresh-job';

export const runtime = 'nodejs';
export const maxDuration = 300;

const DEFAULT_START = '1995-01-01';

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const url = new URL(req.url);
  const startDate = url.searchParams.get('since') ?? DEFAULT_START;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    return NextResponse.json(
      { error: 'since param must be YYYY-MM-DD' },
      { status: 400 },
    );
  }
  try {
    const supabase = createAdminClient();
    const summary = await runRefresh(supabase, startDate);
    return NextResponse.json(summary);
  } catch (err) {
    console.error('[api/macro/backfill] failed:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'backfill failed' },
      { status: 500 },
    );
  }
}

export const POST = GET;
