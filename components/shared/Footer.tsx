'use client';

import { usePathname } from 'next/navigation';
import { tokens } from '@/lib/tokens';

function modeFromPath(pathname: string): string {
  if (pathname === '/') return 'Bellbird';
  if (pathname.startsWith('/library')) return 'Library';
  if (pathname.startsWith('/develop')) return 'Develop';
  if (pathname.startsWith('/portfolio')) return 'Portfolio';
  if (pathname.startsWith('/cycles')) return 'Cycles';
  return 'Bellbird';
}

export function Footer() {
  const pathname = usePathname() ?? '';
  const mode = modeFromPath(pathname);

  return (
    <footer className="max-w-6xl mx-auto px-6 sm:px-10 mt-16">
      <div className="hairline" />
      <div className="py-6 flex items-center justify-between flex-wrap gap-3">
        <div
          className="font-sans text-[10px] tracking-[0.22em] uppercase"
          style={{ color: tokens.fade }}
        >
          Bellbird · v0
        </div>
        <div
          className="font-sans text-[10px] tracking-[0.22em] uppercase"
          style={{ color: tokens.fade }}
        >
          Currently viewing · {mode}
        </div>
      </div>
    </footer>
  );
}
