'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings } from 'lucide-react';
import { tokens } from '@/lib/tokens';

const MODES = [
  { href: '/library', label: 'Library' },
  { href: '/develop', label: 'Develop' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/cycles', label: 'Cycles' },
];

function isAuthPath(pathname: string): boolean {
  return pathname.startsWith('/login') || pathname.startsWith('/auth/');
}

type HeaderUser = { email: string | null } | null;

export function Header({ user }: { user: HeaderUser }) {
  const pathname = usePathname() ?? '';
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [menuOpen]);

  if (isAuthPath(pathname)) return null;

  return (
    <header style={{ borderBottom: `1px solid ${tokens.hairline}` }}>
      <div className="max-w-6xl mx-auto px-6 sm:px-10 py-5 flex items-center justify-between flex-wrap gap-y-3">
        <Link href="/" className="flex items-baseline gap-3 btn-quiet">
          <span
            className="font-serif text-[26px] tracking-tight"
            style={{ fontWeight: 400 }}
          >
            Bellbird
          </span>
          <span className="font-sans text-[10px] tracking-[0.22em] uppercase text-whisper">
            Ideas before signals
          </span>
        </Link>

        <nav className="flex items-center gap-6 sm:gap-7">
          {MODES.map((m) => {
            const active = pathname === m.href || pathname.startsWith(`${m.href}/`);
            return (
              <Link
                key={m.href}
                href={m.href}
                className="mode-pill font-sans text-[11px] tracking-[0.16em] uppercase"
                style={{
                  color: active ? tokens.ink : tokens.whisper,
                  borderBottom: active
                    ? `1px solid ${tokens.chime}`
                    : '1px solid transparent',
                  paddingBottom: 4,
                }}
              >
                {m.label}
              </Link>
            );
          })}

          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="btn-quiet text-whisper"
              aria-label="Settings"
              aria-haspopup="true"
              aria-expanded={menuOpen}
            >
              <Settings size={14} strokeWidth={1.5} />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 mt-3 w-64 z-10 p-4"
                style={{
                  background: tokens.paper,
                  border: `1px solid ${tokens.hairline}`,
                }}
              >
                {user ? (
                  <>
                    <div
                      className="font-sans text-[10px] tracking-[0.22em] uppercase mb-1"
                      style={{ color: tokens.whisper }}
                    >
                      Signed in as
                    </div>
                    <div
                      className="font-mono text-[12px] mb-4 break-all"
                      style={{ color: tokens.ink }}
                    >
                      {user.email ?? 'unknown'}
                    </div>
                    <form action="/auth/sign-out" method="post">
                      <button
                        type="submit"
                        className="font-sans text-[10px] tracking-[0.22em] uppercase btn-quiet"
                        style={{ color: tokens.ink }}
                      >
                        Sign out
                      </button>
                    </form>
                  </>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="font-sans text-[10px] tracking-[0.22em] uppercase btn-quiet"
                    style={{ color: tokens.ink }}
                  >
                    Sign in
                  </Link>
                )}
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
