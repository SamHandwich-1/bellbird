# Prompt harness

Standalone CLI for testing system prompts against the real Anthropic and xAI APIs. Outside the Next.js app — no shared imports with `lib/` or `app/`. Reads API keys from `.env.local` via Node's `--env-file` flag.

## Usage

Single shot:

```
npm run prompt-harness -- \
  --prompt scripts/prompt-harness/prompts/phase-1.md \
  --fragment scripts/prompt-harness/fragments/grid.md \
  --model opus
```

Matrix (N prompts × M fragments):

```
npm run prompt-harness -- \
  --prompt-dir scripts/prompt-harness/prompts \
  --fragment-dir scripts/prompt-harness/fragments \
  --model sonnet
```

`--model` ∈ `opus | sonnet | grok`. Matrix mode globs `*.md` and `*.txt` in each dir and runs the cartesian product **sequentially** (predictable cost + rate-limit behaviour).

## Flags

| Flag | Default | Notes |
|---|---|---|
| `--out-dir <dir>` | `scripts/prompt-harness/outputs` | Where output files are written |
| `--max-tokens <N>` | `4096` | Per-call response cap |
| `--temperature <0..2>` | `0.4` | Applies to **Grok only**. Opus 4.7 and Sonnet 4.6 deprecated `temperature` — the flag is silently ignored for those models. Default 0.4 is lower than typical (0.7) because this is a measuring instrument: variance should come from prompts, not sampling. |
| `--json` | off | Emit JSON instead of markdown |
| `--dry-run` | off | Print combinations, do not call the API |
| `--help` | — | Show usage |

## Output

One file per call, named `YYYYMMDDHHMMSS-{model}-{prompt-base}-{fragment-base}.{md|json}`.

Markdown output has YAML frontmatter for metadata + sections for the system prompt, user input, and model response. Errors are written to `*-ERROR.md` with the same metadata block so a failed matrix run still produces inspectable artifacts.

Outputs are gitignored — they're test artifacts, not source.

## Folders

- `prompts/` — your system-prompt files (`.md` or `.txt`). Tracked.
- `fragments/` — your thesis-fragment files. Tracked.
- `outputs/` — generated, gitignored.

## API keys

The npm script invokes `tsx --env-file=.env.local`, so `.env.local` must populate `ANTHROPIC_API_KEY` and `XAI_API_KEY`. Keys are never logged, never written to output files, never echoed in errors.

## Cost discipline

This tool spends real money. Approximate per call:

- Opus: ~$0.03–$0.15 (depending on prompt + response length)
- Sonnet: ~$0.005–$0.03
- Grok: ~$0.01–$0.05

A 4×4 matrix run on Opus is roughly $0.50–$2.00. Use `--dry-run` first to confirm the combination set, and prefer Sonnet/Grok for iteration sweeps where the prompt under test is what's being measured (not the model).
