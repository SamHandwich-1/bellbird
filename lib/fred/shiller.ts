// CAPE / Shiller PE fetcher — multpl.com only.
//
// Yale's `ie_data.xls` was the original primary source, but parsing a
// proprietary binary XLS with multi-row headers proved fragile. multpl.com
// publishes the same Shiller PE data as a plain HTML table at
// https://www.multpl.com/shiller-pe/table/by-month — newest-first, monthly
// observations back to 1881 plus an additional "current month" entry dated
// to the latest publication day (e.g. "May 21, 2026").
//
// Table shape:
//   <table id="datatable">
//     <tr><th>Date</th><th>Value</th></tr>
//     <tr class="odd">
//       <td>May 21, 2026</td>
//       <td>&#x2002; 41.87 </td>
//     </tr>
//     ...
//   </table>
//
// Value cells contain `&#x2002;` (em-space) plus surrounding whitespace and
// newlines, which is why the previous `[\d.,\s]+` character class regex
// returned zero matches.

import type { Datum } from './stats';

const MULTPL_URL = 'https://www.multpl.com/shiller-pe/table/by-month';

export type ShillerFetchResult = {
  source: 'multpl';
  observations: Datum[];
};

export async function fetchCape(opts?: { startDate?: string }): Promise<ShillerFetchResult> {
  const observations = await fetchCapeFromMultpl(opts);
  return { source: 'multpl', observations };
}

async function fetchCapeFromMultpl(opts?: { startDate?: string }): Promise<Datum[]> {
  console.log('[shiller] GET', MULTPL_URL);
  const res = await fetch(MULTPL_URL, {
    cache: 'no-store',
    headers: { 'User-Agent': 'Bellbird/1.0 (cycles dashboard)' },
  });
  const ct = res.headers.get('content-type') ?? '?';
  console.log(`[shiller] HTTP ${res.status} ct=${ct}`);
  if (!res.ok) {
    const bodyText = await res.text().catch(() => '');
    throw new Error(
      `multpl HTTP ${res.status} ct=${ct} body="${bodyText.slice(0, 300).replace(/\s+/g, ' ')}"`,
    );
  }
  const html = await res.text();
  console.log(`[shiller] body length=${html.length}`);

  // Slice to the <table id="datatable"> block so any other tables on the page
  // (navigation, ads) can't accidentally match.
  const tableStart = html.indexOf('<table id="datatable"');
  if (tableStart < 0) {
    const sample = html.slice(0, 500).replace(/\s+/g, ' ');
    throw new Error(`multpl: <table id="datatable"> not found. sample="${sample}"`);
  }
  const tableEnd = html.indexOf('</table>', tableStart);
  const tableHtml = tableEnd > 0 ? html.slice(tableStart, tableEnd) : html.slice(tableStart);

  // Each data row: <tr class="odd|even"><td>Date</td><td>... value ...</td></tr>
  // Value cell can contain HTML entities (em-space  ), newlines, padding.
  const rowRe = /<tr[^>]*>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/gi;

  const startDate = opts?.startDate ?? '1900-01-01';
  const out: Datum[] = [];
  let match: RegExpExecArray | null;
  while ((match = rowRe.exec(tableHtml)) !== null) {
    const dateText = match[1].trim();
    const valueText = match[2]
      .replace(/&#x[0-9a-f]+;/gi, '')   // hex HTML entities (em-space etc.)
      .replace(/&#\d+;/g, '')           // decimal HTML entities
      .replace(/&\w+;/g, '')            // named entities (&nbsp; etc.)
      .replace(/,/g, '')                // thousand separators
      .replace(/\s+/g, '');             // remaining whitespace

    const date = parseMultplDate(dateText);
    if (!date) continue;
    if (date < startDate) continue;

    const value = Number(valueText);
    if (!Number.isFinite(value)) continue;
    out.push({ date, value });
  }

  if (out.length === 0) {
    const sample = tableHtml.slice(0, 800).replace(/\s+/g, ' ');
    throw new Error(`multpl regex produced zero rows. sample="${sample}"`);
  }

  console.log(`[shiller] parsed ${out.length} observations`);
  // multpl orders newest-first; downstream wants oldest-first.
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

const MONTH_NAMES: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
};

// "May 21, 2026" → "2026-05-21". Use day-precise dates so the current-month
// entry (e.g. "May 21, 2026") doesn't collide with the official first-of-month
// observation ("May 1, 2026") under the (series_id, observation_date) unique
// constraint. resampleToMonthly downstream still buckets to month for the
// sparkline display.
function parseMultplDate(raw: string): string | null {
  const m = raw.match(/^([A-Za-z]+)\s+(\d+),\s*(\d{4})$/);
  if (!m) return null;
  const monthKey = m[1].slice(0, 3).toLowerCase();
  const month = MONTH_NAMES[monthKey];
  if (!month) return null;
  const day = String(Number(m[2])).padStart(2, '0');
  return `${m[3]}-${month}-${day}`;
}
