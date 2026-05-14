# Bowerbird — Visual Identity Guide

## Brand essence

Bowerbird is named for the Australian Satin Bowerbird — a species whose males collect only blue objects and arrange them with deliberate aesthetic care. The metaphor maps directly to the platform's purpose: gathering signal from a vast field of market noise, keeping only what is genuinely valuable, and arranging it for clear thinking.

**Brand voice**: considered, quietly confident, uncluttered. Never loud. Never speculative. The system speaks rarely but says things worth hearing.

**One-line positioning**: "A system that watches many sources, keeps only the blue ones, and reasons over what it has gathered."

## Identity approach

Bowerbird's identity is built entirely around typography and color. No illustrative mark, no icon, no logo glyph. The brand expression is the wordmark itself, set in a high-quality typeface, given space, and deployed consistently. This is intentional:

1. **Typography ages better than illustration.** A well-set wordmark in a quality typeface looks as good in 2035 as it does today. Illustrative marks calcify into specific eras.
2. **The metaphor is in the name, not in iconography.** "Bowerbird" already carries the meaning. Adding a stylized bird on top is redundant and risks looking literal.
3. **Confidence through restraint.** The most considered investment platforms (private banks, research houses, institutional research desks) use wordmarks rather than mascots. Restraint signals seriousness.

## Typeface

**Söhne, by Klim Type Foundry.**

Söhne is a neo-grotesque descended from Akzidenz-Grotesk and Helvetica, but warmer and more refined than either. Confident, modernist, Swiss-influenced. It reads as fintech-mature without feeling generic — the typeface used by Apollo, Christie's, and many other considered institutional brands.

Klim, based in Wellington, makes some of the finest contemporary typefaces in the world. The investment in a Söhne license is genuine investment in the brand.

URL: klim.co.nz/retail-fonts/sohne/

### Weights in use

- **Söhne Buch** (Book / 400) — body text, standard UI, long-form prose
- **Söhne Kräftig** (Medium / 500) — wordmark, headings, emphasis, captions
- **Söhne Mono** — numbers, tickers, code, indicator readouts

A working set of these three weights covers every typographic need across the platform. Other weights (Leicht, Halbfett, Dreiviertelfett) are not used.

### Licensing

Söhne is a paid commercial typeface. Single-user desktop licenses for individual weights are approximately USD $79 each. A working set of Buch + Kräftig + Mono runs USD $200–300 all-up. Web font licensing is separate and tier-based by traffic.

For development before licensing, or for users without the licensed font, fall back to **Inter** — free, open source, very close in proportion and intent to Söhne. Many users will not notice the difference.

```css
font-family: "Söhne", "Söhne Buch", "Inter",
             -apple-system, BlinkMacSystemFont,
             "Helvetica Neue", sans-serif;
```

## Wordmark

The Bowerbird wordmark is simply the word "Bowerbird" set in the chosen typeface, Medium weight (500), in Bower Indigo (#0F1B3D), with negative letter-spacing of approximately -1.5% to tighten the rhythm.

### Construction

- Typeface: **Söhne Kräftig (Medium / 500)**
- Color: **#0F1B3D** (Bower Indigo)
- Letter-spacing: **-1.5%** (approximately -0.8 to -1.5 px at typical sizes)
- Capitalization: sentence case ("Bowerbird"), never all-caps

### With tagline

When used with the tagline "INVESTMENT  INTELLIGENCE":
- Tagline in same typeface, 11–13px, weight 500
- Color: #5F5E5A (warm neutral grey)
- Letter-spacing: +3px tracked
- Two spaces between words (not single)
- All caps
- Positioned below wordmark with consistent baseline relationship

### Without tagline

For most applications, the wordmark alone is sufficient. The tagline is optional and used primarily on marketing materials, document covers, and the dashboard header.

### Clear space

Maintain space equal to the height of the lowercase 'o' in "Bowerbird" around all sides of the wordmark. Never crowd it.

### Minimum size

- With tagline: 200px wide minimum
- Without tagline: 120px wide minimum
- The wordmark should never appear below 24px tall on screen; below this, legibility breaks down.

### Don'ts

- Do not stretch, condense, or distort
- Do not change the case ("BOWERBIRD" or "bowerbird" both wrong)
- Do not place on busy or low-contrast backgrounds
- Do not add ornamentation, swooshes, or icons
- Do not use weights other than Medium (500) for the wordmark itself
- Do not change the color outside the approved palette

## Color palette

### Primary

| Name | Hex | Use |
|------|-----|-----|
| Bower Indigo | `#0F1B3D` | Primary text, wordmark, structural elements, dark backgrounds |
| Satin Blue | `#1E5BC6` | Brand accent, charts, links, key emphasis |
| Sky Glint | `#7BB3F0` | Highlights, secondary chart series, hover states |
| Paper | `#FAFAF7` | Default light background; warmer than pure white |
| Mist | `#E8EFF8` | Surface fills, cards, dividers |
| Lichen Gold | `#C9A227` | SwanSong alerts, caution states, "this matters" emphasis |

### Status

| Name | Hex | Use |
|------|-----|-----|
| Healthy | `#2D7A4F` | Positive states, healthy indicators |
| Caution | `#C9A227` | Warning states (same as Lichen Gold) |
| Alert | `#B83C2D` | Critical states, drawdown indicators |

### Neutral text

| Name | Hex | Use |
|------|-----|-----|
| Body | `#1A1A1A` | Long-form body copy on Paper backgrounds |
| Secondary | `#5F5E5A` | Tagline, captions, secondary metadata |
| Tertiary | `#8B8A85` | Disabled, very-secondary metadata |

### Pairing rules

- **Bower Indigo on Paper**: default for documents, dashboard headers, the wordmark itself
- **Satin Blue**: reserved for accents, links, primary chart series. Never used for body text.
- **Lichen Gold**: appears only when meaningful — never decoratively. It signals: this is worth your attention. SwanSong alerts use it; nothing else should.
- **Status colors**: only on actual status. Never used as decorative chrome.

## Typography scale

System defaults across all surfaces (dashboards, documents, alerts):

| Role | Size | Weight | Line height | Notes |
|------|------|--------|-------------|-------|
| Display | 48px | 500 | 1.1 | Hero, marketing only |
| H1 | 32px | 500 | 1.2 | Page titles |
| H2 | 22px | 500 | 1.3 | Section headings |
| H3 | 18px | 500 | 1.4 | Subsections |
| Body | 15px | 400 | 1.7 | Standard prose |
| Body small | 13px | 400 | 1.6 | Secondary content |
| Caption | 11px | 500 | 1.4 | Metadata, labels |
| Mono | 13px | 400 | 1.5 | Numbers, tickers, code |

Use sentence case throughout. No title case. No all-caps except for spaced metadata labels (e.g., "INVESTMENT  INTELLIGENCE" or "FRAGILITY  SCORE").

## Component identification

Each Bowerbird component is referred to in copy and UI by its name in the standard typeface — no symbols, no icons, no badges. The wordmark approach extends to components.

Where space allows, components may be referred to with a small dot in their assigned color preceding the name:

```
• Magpie         — signals
• Huginn         — decisions
• Muninn         — memory
• SwanSong       — fragility (Lichen Gold dot — the only non-blue)
• Lovebird       — pairs
• Lyrebird       — replay
• Bower          — dashboard
```

The Lichen Gold dot for SwanSong is the only divergence from Satin Blue, reinforcing its role as the alert layer.

## Voice and language

### Do

- "SwanSong fired" not "SwanSong predicts"
- "Elevated fragility" not "Imminent crash"
- "Strongest analogue: Q3 2007" not "This is just like 2008"
- "Conviction: 3/5" not "Pretty sure"
- "Recommended sizing: 2.5%" not "Buy a bit"

### Don't

- Hype language ("crushing it," "moonshot," "10x")
- Certainty language ("guaranteed," "will happen," "definitely")
- Trader bro vocabulary ("pump," "yolo," "diamond hands")
- Emojis in product copy or alerts
- Exclamation marks in alerts; gravity by default

### Tagline

Primary: **"Investment intelligence"** (under wordmark, when used)

Extended forms for marketing:
- "We collect only the blue ones."
- "A discipline, not a crystal ball."
- "Watching the macro, remembering the past, sizing the present."
- "Built for the long arc."

## Application patterns

### Dashboard (Bower)

Paper (#FAFAF7) page background. White card surfaces with subtle 0.5px borders in Mist (#E8EFF8). Bower Indigo text. Status dots in their respective colors. Charts default to Satin Blue with Sky Glint for secondary series. SwanSong alerts framed in Lichen Gold border-left strips, never as full Lichen Gold backgrounds.

The wordmark sits in the top-left of the dashboard header in 24px size, no tagline.

### Alerts

SwanSong alerts arrive in Telegram and Slack with a consistent header format:

```
SwanSong · [date] · Fragility 7.2/10
[brief regime statement]
```

Body uses bullet points sparingly. Historical analogues always cited by event name and similarity score. Recommended actions phrased as Huginn context shifts, not direct trade instructions.

### Documents

- Cover pages: Bower Indigo background, wordmark in Paper white in upper left, title centered, generous space
- Internal pages: Paper background, Bower Indigo headings, body text in #1A1A1A, Satin Blue for links and emphasis
- Tables: minimal lines, generous padding, Mist (#E8EFF8) used sparingly for header rows or zebra striping

### Favicon and avatar

Where an icon-sized representation is required (browser favicons, Telegram/Slack bot avatars, file system icons), use a simple square in Bower Indigo with a single capital "B" centered in the chosen typeface, in Satin Blue. This is the only place anything resembling an icon appears in the brand system.

## File assets

- `bowerbird_wordmark.svg` — wordmark with tagline (default for marketing, doc covers)
- `bowerbird_wordmark_minimal.svg` — wordmark only, no tagline (default for app/dashboard headers)
- `bowerbird_favicon.svg` — square "B" mark for favicons, bot avatars

These SVGs reference Söhne via CSS font-family with Inter as fallback. Once the Söhne license is acquired and the font is installed/served, the SVGs will render in true Söhne automatically. Until then they render in Inter, which is intentionally close in proportion.

## Implementation notes

### Web (Bower dashboard)

```css
:root {
  /* Color tokens */
  --bower-indigo: #0F1B3D;
  --satin-blue: #1E5BC6;
  --sky-glint: #7BB3F0;
  --paper: #FAFAF7;
  --mist: #E8EFF8;
  --lichen-gold: #C9A227;

  --status-healthy: #2D7A4F;
  --status-caution: #C9A227;
  --status-alert: #B83C2D;

  --text-body: #1A1A1A;
  --text-secondary: #5F5E5A;
  --text-tertiary: #8B8A85;

  /* Type tokens */
  --font-sans: "Söhne", "Inter", -apple-system, BlinkMacSystemFont,
               "Helvetica Neue", sans-serif;
  --font-mono: "Söhne Mono", "JetBrains Mono", ui-monospace, monospace;
}
```

### Documents

Maintain palette consistency across Notion, Google Docs, and printed materials. For Notion specifically, use the closest match from Notion's color palette (default text and a custom blue callout) since Notion doesn't support custom hex values directly.

### Telegram and Slack

Bot avatars: 256×256 PNG of the favicon design (Bower Indigo square, Satin Blue "B"). Display name: "Bowerbird". Description: "Investment intelligence."
