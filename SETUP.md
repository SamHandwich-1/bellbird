# Bellbird — Setup Guide

This guide gets you from empty repo to running Claude Code session. Follow in order. Each step is small.

---

## Step 1: Save the handoff files

You should have received three documents:

- `CLAUDE.md`
- `PLAN.md`
- `SETUP.md` (this file)

Save all three into `C:/Users/james/bellbird/` (the root of your repo).

Also save these reference files into `C:/Users/james/bellbird/references/`:

- `bellbird-mockup.jsx` (from earlier in this conversation)
- `theses-book.jsx` (your current thesis book)

Create the `references/` folder first:

```bash
cd C:/Users/james/bellbird
mkdir references
```

Then drop the two reference files into it.

Optional but recommended — also save into `references/`:

- `BOWERBIRD_BRAND_GUIDE.md`
- `BOWERBIRD_PLATFORM.md`

These give Claude Code context on the broader three-bird stack and brand voice.

---

## Step 2: Pre-create external accounts

These need to exist before Claude Code can deploy. Do them now to avoid context-switching during the build.

### GitHub
- Already done — repo exists at `github.com/SamHandwich-1/bellbird`

### Supabase
1. Go to [supabase.com](https://supabase.com), sign in or create account
2. Click "New project"
3. Name: `bellbird`
4. Database password: generate strong password, save it somewhere
5. Region: choose closest to you (likely Singapore or Sydney for Melbourne)
6. Plan: Free (sufficient for v1)
7. Wait ~2 minutes for project to provision

Once provisioned, find and save these from project Settings → API:
- Project URL (looks like `https://xxxxx.supabase.co`)
- `anon` public key (long string)
- `service_role` secret key (long string, keep this very secret)

### Vercel
1. Go to [vercel.com](https://vercel.com), sign in with GitHub
2. Authorize Vercel to access your GitHub account
3. Don't import the project yet — we'll do that after Turn 1 code lands

### API keys check
Confirm you have access to these (Claude Code will need them at various turns):

- **Anthropic API key** — from [console.anthropic.com](https://console.anthropic.com) → Settings → API Keys
- **xAI API key** — from [x.ai](https://x.ai) → API console
- **FRED API key** — from [fred.stlouisfed.org/docs/api/api_key.html](https://fred.stlouisfed.org/docs/api/api_key.html) (free, instant)
- **Polygon Massive API key** — from your Polygon dashboard

### Database migrations and Storage

The schema lives in `db/schema.sql` (initial create-everything script) plus incremental migrations under `db/migrations/`. Apply them in order via the Supabase SQL Editor on a fresh project, or whenever you pull a new turn that adds one.

Current migrations:

1. `db/schema.sql` — base tables (run once on a fresh project).
2. `db/migrations/0001_supersede_pipeline_rows.sql` — soft-supersede mechanism for the Iterate flow.
3. `db/migrations/0002_current_prices.sql` — manual current-price lookup per ticker.
4. `db/migrations/0003_attachments.sql` — Develop-mode attachments table (images, PDFs, pasted text).
5. `db/migrations/0004_message_iteration.sql` — iteration index on `messages` and `conversations` for IterationDivider rendering.
6. `db/migrations/0005_storage_rls.sql` — Storage RLS policies for the `thesis-attachments` bucket. **Run this AFTER creating the bucket below — the policies target objects in that specific bucket.**

### Storage: `thesis-attachments` bucket

Develop-mode attachments (Item 13) upload binary content to a Supabase Storage bucket. One-time setup:

1. In the Supabase dashboard, go to **Storage** → **New bucket**.
2. Name: `thesis-attachments` (exact spelling — code references this string).
3. Public bucket: **No** (private — reads happen via signed URLs only).
4. File size limit: 10 MB (matches the client-side check in `AttachmentButton`).
5. Allowed MIME types: leave empty (the client restricts to `image/png`, `image/jpeg`, `application/pdf` already).
6. Create the bucket.
7. Run `db/migrations/0005_storage_rls.sql` in the SQL Editor — this adds the INSERT/SELECT/DELETE policies on `storage.objects` for this bucket. Without these policies, uploads fail with *"new row violates row-level security policy"*.

To verify: in Develop mode, click the paperclip in the chat input area, pick an image, and confirm the chip appears above the textarea without an error toast.

---

## Step 3: Install Claude Code

If not already installed:

```bash
# In any terminal (Git Bash, PowerShell, or WSL)
curl -fsSL https://claude.ai/install.sh | bash
```

Or via npm:

```bash
npm install -g @anthropic-ai/claude-code
```

Verify:

```bash
claude --version
```

Should show something like `claude-code 1.x.x`.

---

## Step 4: Optional — Install the Vercel CLI

Useful so Claude Code can deploy directly without you context-switching to the Vercel dashboard.

```bash
npm install -g vercel
vercel login
```

Follow the auth flow. After this, the `vercel` command works from any directory.

---

## Step 5: Open Claude Code in the project

```bash
cd C:/Users/james/bellbird
claude
```

This starts Claude Code in your repo. It will auto-load `CLAUDE.md` as context.

---

## Step 6: First commands inside Claude Code

Use these to set Claude Code up correctly. Type each as a command to Claude Code:

### 6a. Confirm context loaded

```
/help
```

This shows available commands. Confirms Claude Code is running.

### 6b. Read the plan

```
Read PLAN.md, CLAUDE.md, and references/bellbird-mockup.jsx in full. Summarize what you understand about the project, the architecture, and the turn structure. Flag anything ambiguous before we begin.
```

Claude Code will read everything and summarize back. Review the summary; correct any misunderstandings before proceeding.

### 6c. Enter plan mode for Turn 1

```
/plan
```

Then:

```
Plan Turn 1: project skeleton. List every file you intend to create, in order, with one-line description of each. Identify any decisions you need from me before writing code. Wait for my approval before generating files.
```

Claude Code will produce a plan. Review it. Push back if anything seems wrong. Approve when ready.

### 6d. Execute Turn 1

Once you approve the plan, Claude Code will generate files. It runs:

```bash
npm install
```

This takes 2-3 minutes. Then:

```bash
npm run dev
```

Visit `http://localhost:3000` and verify Bellbird renders.

### 6e. Deploy to Vercel

After local verification, ask Claude Code to push to GitHub and connect Vercel:

```
Commit the work with a clean message, push to main, then deploy to Vercel. Use vercel CLI. Add Supabase URL, Supabase anon key, Supabase service role key, Anthropic API key, and xAI API key as environment variables in the deployment.
```

You'll need to paste the actual key values when prompted (don't share them in chat history, paste directly into Vercel via the CLI prompts or dashboard).

Claude Code can run the Vercel CLI commands; you'll authenticate when prompted.

---

## Step 7: Verify deployed app

After deploy, Claude Code will give you a URL like `bellbird-xxxxx.vercel.app`. Open it. You should see:

- Bellbird identity page identical to the mockup
- Header with mode switcher (Library / Develop / Portfolio / Cycles)
- Each placeholder mode shows "Coming in Turn N"
- No console errors

If everything works, Turn 1 is complete. Take a break before Turn 2.

---

## What happens next

**Turn 2** (next session, or continue immediately): Library mode and auth. Same pattern — `/plan`, review, approve, execute, verify, deploy.

**Turns 3-5** follow same pattern.

### Tips for working with Claude Code

- **Always start in plan mode for new turns.** Don't skip to execution. The plan-first discipline catches issues cheap.
- **Read the diff before committing.** Claude Code shows you what files changed; skim them. Catch anything unexpected.
- **Verify before declaring done.** Don't trust "looks good" — actually click through the new functionality.
- **Use `/clear` between major work units.** Keeps context window manageable.
- **Don't run multiple tabs for greenfield work.** Until there's a real codebase, one tab is enough.

### When things go wrong

- **Build errors:** Ask Claude Code to read the error and fix. Usually one-shot.
- **Vercel deploy fails:** Check environment variables are set. Most common issue.
- **Supabase auth issues:** Confirm site URL and redirect URLs match in Supabase Auth settings.
- **Anthropic/xAI rate limits:** Slow down API calls; add backoff in code.
- **TypeScript errors:** Don't `@ts-ignore`. Ask Claude Code to fix properly.

### Getting unstuck

If Claude Code gets confused or stuck, the fastest recovery is:

```
/clear
```

Then re-establish context:

```
Re-read CLAUDE.md and PLAN.md. Confirm what turn we are in and what was completed. Continue from there.
```

---

## A note on this handoff

I (Claude Opus in the chat interface) am handing this project off to Claude Code (the agent in your terminal). Claude Code has tools I don't — it can write files directly, run shell commands, install dependencies, deploy. But it benefits from the planning and design work we've already done.

The PLAN.md and CLAUDE.md documents are the bridge. They carry forward every architectural decision we made in chat so Claude Code doesn't re-derive them from scratch.

When you come back to me in the chat, you can paste any of these into context to bring me up to speed on what was built. We can do design iterations, discuss problems, plan future turns. Claude Code executes; we strategize.

This split — strategy in chat, execution in agent — is the right shape for this work. Use both. They complement each other.

Good luck with the build.
