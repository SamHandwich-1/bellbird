'use client';

import { useState, useTransition, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { sendMagicLink } from './actions';
import { tokens } from '@/lib/tokens';

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams?.get('next') ?? '/library';
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await sendMagicLink(email, next);
      if ('error' in result) setError(result.error);
      else setSent(true);
    });
  }

  return (
    <div className="w-full max-w-md">
      <Link href="/" className="btn-quiet inline-flex items-baseline gap-3 mb-12">
        <span className="font-serif text-[26px] tracking-tight" style={{ fontWeight: 400 }}>
          Bellbird
        </span>
        <span className="font-sans text-[10px] tracking-[0.22em] uppercase text-whisper">
          Ideas before signals
        </span>
      </Link>

      {sent ? (
        <div>
          <h1
            className="font-serif text-[36px] tracking-tight mb-4"
            style={{ fontWeight: 340 }}
          >
            Check your email
          </h1>
          <p
            className="font-serif text-[16px] leading-[1.6] max-w-[44ch]"
            style={{ fontWeight: 340, color: tokens.ash }}
          >
            A magic link is on its way to <span className="font-mono">{email}</span>. Click
            it from this device to sign in. The link expires in an hour.
          </p>
          <button
            type="button"
            onClick={() => {
              setSent(false);
              setEmail('');
            }}
            className="mt-8 font-sans text-[10px] tracking-[0.22em] uppercase btn-quiet text-whisper"
          >
            Use a different email
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit}>
          <h1
            className="font-serif text-[36px] tracking-tight mb-2"
            style={{ fontWeight: 340 }}
          >
            Sign in
          </h1>
          <p
            className="font-sans text-[12px] leading-[1.6] mb-10"
            style={{ color: tokens.ash }}
          >
            One link, one click. No passwords.
          </p>

          <label
            htmlFor="email"
            className="font-sans text-[10px] tracking-[0.22em] uppercase block mb-3"
            style={{ color: tokens.whisper }}
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            className="font-serif text-[18px] w-full bg-transparent pb-2"
            style={{
              fontWeight: 340,
              color: tokens.ink,
              borderBottom: `1px solid ${tokens.hairline}`,
              outline: 'none',
            }}
            disabled={pending}
          />

          {error && (
            <div
              className="mt-4 font-sans text-[12px]"
              style={{ color: tokens.terracotta }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-10 font-sans text-[11px] tracking-[0.22em] uppercase btn-quiet inline-flex items-center gap-2"
            style={{
              color: tokens.ink,
              borderBottom: `1px solid ${tokens.ink}`,
              paddingBottom: 4,
              opacity: pending ? 0.5 : 1,
            }}
          >
            {pending ? 'Sending' : 'Send magic link'}
            <ArrowUpRight size={12} strokeWidth={1.5} />
          </button>
        </form>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
