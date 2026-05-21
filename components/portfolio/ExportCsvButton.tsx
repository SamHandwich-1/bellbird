import { Download } from 'lucide-react';
import { tokens } from '@/lib/tokens';

// Plain RSC — no state. Browser handles the download via the route's
// Content-Disposition header.
export function ExportCsvButton() {
  return (
    <a
      href="/api/portfolio/export"
      download
      className="font-sans text-[10px] tracking-[0.22em] uppercase btn-quiet inline-flex items-center gap-2"
      style={{ color: tokens.ink }}
    >
      <Download size={12} strokeWidth={1.5} />
      Export CSV
    </a>
  );
}
