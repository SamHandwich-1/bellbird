// Manual annual resync — 24-month window, hit by hand each February after
// BLS releases its annual payroll benchmark revisions (which restate up to
// ~12 months back). Same auth as the cron route.
//
//   curl -H "Authorization: Bearer $CRON_SECRET" \
//        https://bellbird-eta.vercel.app/api/macro/resync

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { runRefresh } from '@/lib/fred/refresh-job';

export const runtime = 'nodejs';
export const maxDuration = 120;

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

function twentyFourMonthsAgo(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 24);
  return d.toISOString().slice(0, 10);
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  try {
    const supabase = createAdminClient();
    const summary = await runRefresh(supabase, twentyFourMonthsAgo());
    return NextResponse.json(summary);
  } catch (err) {
    console.error('[api/macro/resync] failed:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'resync failed' },
      { status: 500 },
    );
  }
}

export const POST = GET;
