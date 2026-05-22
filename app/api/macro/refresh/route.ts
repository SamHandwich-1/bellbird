// Daily cron — calls runRefresh with a 90-day window.
//
// Schedule lives in vercel.json (two daily firings, 22:00 UTC + 09:00 UTC).
// Auth is Bearer CRON_SECRET; Vercel sends this automatically on scheduled
// invocations once the cron is configured.

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { runRefresh } from '@/lib/fred/refresh-job';

export const runtime = 'nodejs';
export const maxDuration = 60;

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get('authorization') ?? '';
  return header === `Bearer ${secret}`;
}

function ninetyDaysAgo(): string {
  const d = new Date();
  d.setDate(d.getDate() - 90);
  return d.toISOString().slice(0, 10);
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  try {
    const supabase = createAdminClient();
    const summary = await runRefresh(supabase, ninetyDaysAgo());
    return NextResponse.json(summary);
  } catch (err) {
    console.error('[api/macro/refresh] failed:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'refresh failed' },
      { status: 500 },
    );
  }
}

// Allow POST as well so it's curl-able both ways.
export const POST = GET;
