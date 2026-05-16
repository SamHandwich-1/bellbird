'use server';

import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export type SendMagicLinkResult = { ok: true } | { error: string };

export async function sendMagicLink(
  email: string,
  next: string,
): Promise<SendMagicLinkResult> {
  if (!email || !email.includes('@')) {
    return { error: 'Please enter a valid email address.' };
  }

  const supabase = await createClient();
  const headersList = await headers();
  const host = headersList.get('host');
  const proto = headersList.get('x-forwarded-proto') ?? 'http';
  const origin = host ? `${proto}://${host}` : 'http://localhost:3000';

  const safeNext = next.startsWith('/') ? next : '/library';
  const emailRedirectTo = `${origin}/auth/callback?next=${encodeURIComponent(safeNext)}`;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo },
  });

  if (error) return { error: error.message };
  return { ok: true };
}
