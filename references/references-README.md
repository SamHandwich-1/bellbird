# references/ — Read-Only Inspiration

**The files in this folder are inspiration and context, not specifications for Bellbird.**

Bellbird's scope is defined in `PLAN.md` and `CLAUDE.md` at the repo root. Those documents are authoritative. Anything in this folder that conflicts with them loses.

---

## What's here and how to use each file

### Active references — USE these

**`bellbird-mockup.jsx`**
- **Purpose:** Visual design source of truth for Bellbird.
- **How to use:** Reference for aesthetic decisions, component patterns, colors, typography, layout, motion. When building any Bellbird UI component, look here first.
- **Scope:** The mockup defines what Bellbird LOOKS like. Do not extend the feature set beyond what's shown here without user approval.

**`theses-book.jsx`**
- **Purpose:** The 19 existing investment theses. Seed data for Turn 2's database import.
- **How to use:** In Turn 2, build a seed script that reads this file and imports the 19 theses into the `theses` and `positions` tables. The data structure here informed the schema in `PLAN.md`.
- **Scope:** This is data, not architecture. Import it; don't model new tables around it.

### Inspiration-only references — DO NOT IMPLEMENT

**`BOWERBIRD_PLATFORM.md`**
**`BOWERBIRD_BRAND_GUIDE.md`**
**`SWANSONG_BRIEF.md`**
**`LOVEBIRD_BRIEF.md`**

- **Purpose:** Documentation for a separate, future project called **Bowerbird**.
- **What Bowerbird is:** A planned 21-week build for a multi-component AI investment decision platform. It is downstream of Bellbird in the user's stack.
- **Why these files are here:** So you understand the broader ecosystem Bellbird sits in. Bowerbird is the eventual destination for theses developed in Bellbird.
- **Critical rule: DO NOT IMPLEMENT ANYTHING FROM THESE FILES IN BELLBIRD.**
- **What you can use:** Bowerbird's brand voice (sentence case, considered language, no emojis), palette philosophy, and overall positioning. Visual continuity across the three-bird stack is desirable.
- **What you cannot use:** Bowerbird's schemas, components, agent architecture, vector embeddings, scenario libraries, pair-trade logic, decision engine patterns, fragility scoring. None of these belong in Bellbird v1.

---

## Concrete examples of in-scope vs. feature creep

### ✅ ALLOWED — Visual / aesthetic continuity

- Using Bowerbird's brand palette as inspiration for Bellbird's design tokens
- Following Bowerbird's voice and tone guidelines (sentence case, no emojis, considered language)
- Adopting Bowerbird's typography philosophy (distinctive display font + refined body font)
- Matching Bowerbird's general "considered, quietly confident" tone in UI copy

### ❌ NOT ALLOWED — Feature creep from Bowerbird docs

- **Do NOT** implement SwanSong's fragility scoring in Bellbird's Cycles page
- **Do NOT** add pair-trade discovery (that's Lovebird, future)
- **Do NOT** build vector embeddings (`pgvector`) for thesis similarity
- **Do NOT** seed historical drawdown events
- **Do NOT** add a `swan_*` schema, `lovebird_*` schema, or any Bowerbird-prefixed tables
- **Do NOT** build an alert system with regime classification
- **Do NOT** add a decision engine, memory layer, or replay/simulator
- **Do NOT** extend the database schema beyond what `PLAN.md` specifies
- **Do NOT** add a "context shift" or "regime" feature to Develop mode
- **Do NOT** model Bellbird's Adjudication phase on Huginn's architecture

---

## The "should I do this?" decision rule

If you find yourself thinking *"the Bowerbird brief mentions X, and it would fit nicely in Bellbird..."* — **STOP.**

That is feature creep. Your default answer is **no**. Flag it for the user to decide. Do not implement it without explicit user approval, even if it seems small and obvious.

The reason for strictness: each individual creep looks reasonable in isolation. Cumulatively, they bloat Bellbird from a 5-turn build into a 20-turn build. Scope discipline at every step is what keeps Bellbird v1 shippable.

---

## When you encounter conflicting information

Priority order, from highest to lowest authority:

1. **Direct user instruction in the current session** — always wins
2. **`PLAN.md`** — the project plan; scope and architecture
3. **`CLAUDE.md`** — conventions, rules, what-not-to-do
4. **`references/bellbird-mockup.jsx`** — visual source of truth
5. **`references/theses-book.jsx`** — seed data structure
6. **This file** — scope boundary clarification
7. **`references/BOWERBIRD_*.md`, `SWANSONG_BRIEF.md`, `LOVEBIRD_BRIEF.md`** — inspiration only, lowest authority

If lower-authority sources conflict with higher-authority ones, the higher-authority source wins. Always.

---

## A note for future you (or any new agent picking this up)

Bowerbird is exciting and well-specified. Its documentation is rich enough to be genuinely tempting to build from. That's exactly why this file exists.

Bellbird is a smaller, focused, deliverable project that ships in 5 turns. It is not a stepping stone to Bowerbird in implementation — it is a sibling tool. The Bowerbird project will be built separately, by Claude Code in a different repo, in its own time.

Stay in your lane. Build Bellbird. Ship v1.
