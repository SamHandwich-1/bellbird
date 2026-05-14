'use client';

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

export function Header() {
  const pathname = usePathname() ?? '';

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
          <button
            type="button"
            className="btn-quiet text-whisper"
            aria-label="Settings"
          >
            <Settings size={14} strokeWidth={1.5} />
          </button>
        </nav>
      </div>
    </header>
  );
}
