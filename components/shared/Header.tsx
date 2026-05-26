'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { tokens } from '@/lib/tokens';

type Mode = {
  key: string;
  label: string;
  href?: string; // omitted = non-clickable placeholder
};

const MODES: Mode[] = [
  { key: 'identity',  label: 'identity',  href: '/' },
  { key: 'library',   label: 'library',   href: '/library' },
  { key: 'develop',   label: 'develop',   href: '/develop' },
  { key: 'watch',     label: 'watch' }, // activated in Turn B
  { key: 'portfolio', label: 'portfolio', href: '/portfolio' },
  { key: 'cycles',    label: 'cycles',    href: '/cycles' },
];

function isAuthPath(pathname: string): boolean {
  return pathname.startsWith('/login') || pathname.startsWith('/auth/');
}

function isActive(mode: Mode, pathname: string): boolean {
  if (!mode.href) return false;
  if (mode.href === '/') return pathname === '/';
  return pathname === mode.href || pathname.startsWith(`${mode.href}/`);
}

export function Header() {
  const pathname = usePathname() ?? '';

  if (isAuthPath(pathname)) return null;

  return (
    <div style={{ borderBottom: `1px solid ${tokens.line}`, marginBottom: 56 }}>
      <div
        style={{
          maxWidth: 920,
          margin: '0 auto',
          padding: '20px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 24,
        }}
      >
        <Link
          href="/"
          className="serif btn-quiet"
          style={{
            fontSize: 18,
            fontWeight: 600,
            letterSpacing: '-0.01em',
            color: tokens.text,
            textDecoration: 'none',
          }}
        >
          Bellbird
        </Link>

        <nav style={{ display: 'flex', gap: 22 }}>
          {MODES.map((m) => {
            const active = isActive(m, pathname);
            const clickable = !!m.href;
            const style: React.CSSProperties = {
              color: active ? tokens.chime : tokens.faint,
              paddingBottom: 2,
              borderBottom: active
                ? `1px solid ${tokens.chime}`
                : '1px solid transparent',
              cursor: clickable ? 'pointer' : 'default',
              textDecoration: 'none',
            };

            if (clickable && m.href) {
              return (
                <Link key={m.key} href={m.href} className="label mode-pill" style={style}>
                  {m.label}
                </Link>
              );
            }
            return (
              <span key={m.key} className="label" style={style}>
                {m.label}
              </span>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
