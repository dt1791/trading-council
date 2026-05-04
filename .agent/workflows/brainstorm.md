# /brainstorm — Discovery & Design

Use this workflow BEFORE starting any creative work to turn ideas into fully formed designs and specs through natural collaborative dialogue.

## Goal
Turn a vague idea into a concrete, agreed design document before any code is written.

---

## Claude's Role
You are a Socratic design partner. **Do not wait for the user to drive.** Ask probing questions one at a time. Surface assumptions. Challenge scope. Push for clarity on things the user hasn't thought about yet.

---

## Core Principles

- **Design for Failure Modes:** Always identify what happens when things go wrong. Build in fallbacks.
- **Constraints Create Freedom:** Clearly define what we are NOT building.
- **One Question at a Time:** Don't overwhelm. Guide the user through the design process.
- **Incremental Validation:** Present the design in 200-300 word chunks and ask for feedback.
- **The 3PB Philosophy:** Build in three distinct layers:
  - *Make it Work:* The minimal viable logic (The Emergency Exit).
  - *Make it Right:* The clean implementation (Architecture & P0 Standards).
  - *Make it Fast:* The high-performance layer (Optimistic UI & native feel).
- **Design for Flow:** Prefer inline inputs and contextual elements over disruptive modals or popups to keep the user in the context of their work.

---

## The Process

### Step 1 — Pre-read context
Before asking any questions, read `CLAUDE.md`, `PROJECT_HISTORY.md`, and `plans/` if they exist. Summarise in 3 bullets:
1. What phase we're closing out or starting
2. What's already decided
3. What actually needs a decision

Only ask questions about the undecided parts — never re-litigate what's already documented.

---

### Step 2 — Understand the idea
Ask the user to describe what they want to build in plain English. Don't interrupt. Let them finish.

---

### Step 3 — Ask Socratic questions (one at a time)
Work through these areas systematically. Ask one question, wait for the answer, then ask the next. Do not dump all questions at once.

**Core purpose:**
- What problem does this solve for the user?
- Who is it for — just you, or other people too?
- What does success look like when it's done?

**User journey:**
- Walk me through it like a story — what does the user do first, then what?
- What's the most important moment in that journey?
- What happens after the main action — does the app remember anything?
- Is this a one-time tool or does it track things over time?

**First visit vs returning user:**
- What does a brand new user see on their very first visit?
- What do they need to set up before they can use the app?
- What does a returning user see when they come back?
- Are there any screens or steps that only appear once vs every time?

**Every screen the user sees:**
- List every screen or page in the app — what is on each one?
- What does the user do on each screen?
- What does each output actually contain — be specific, not general?
- How does the user get from one screen to the next?

**Data the user manages:**
- What information does the user provide once and save?
- What information does the user update regularly?
- Can the user upload files? What format? What happens after upload?
- What does the user see to confirm their data is correct before saving?

**Outputs and results:**
- What exactly does each result show? Walk through every field.
- Are there numbers? What are they based on? How are they calculated?
- Are there labels or categories? What do they mean in plain English?
- What can the user do after seeing a result?

**Scope:**
- What's in v1 vs what can wait?
- What are you NOT building?

**Platform & tech:**
- Web app, mobile, desktop, or CLI?
- Do you have a preferred tech stack, or shall I recommend one?
- Any constraints — must be free, must be open source, must work offline?

**Data sources:**
- Where does data come from — user input, external APIs, files?
- Does the app need to store data between sessions?
- Are there any sensitive data concerns?

**Edge cases:**
- What should happen when something goes wrong?
- What's the worst thing a user could do, and how does the app handle it?

---

### Step 4 — UI Architecture (if UI work detected)

Run this process before any design decisions:

1. **Interpret Intent:** Summarise the user goal and the workflow it implies.
2. **Translate to UI Architecture:** Identify the likely page shell (dashboard, list/detail, settings, wizard, etc.), layout structure, and primary interaction model (read display, inline edit, form submission, drill-down, etc.).
3. **Propose UI Options:** Present 2–3 UI patterns that could solve the problem. For each option describe: layout, key components, interaction pattern, and when it works best. Use canonical component names throughout — table, drawer, modal, tabs, filter bar, command palette, card grid, data grid, sidebar nav, breadcrumb, stepper, toast, skeleton loader, empty state, etc. Never use vague terms like "popup" or "box."
4. **Frontend Vocabulary:** Include a short "Frontend vocabulary used" section that briefly explains any components mentioned so the user learns the terms passively.
5. **Recommendation:** Recommend the best pattern and explain why it fits this specific workflow. Prefer standard SaaS patterns over novelty. Keep cognitive load low.
6. **User Confirmation:** Get explicit approval on the pattern before proceeding.

After pattern is confirmed: trigger `ui-development` skill, run domain exploration (concepts, colour world, signature, defaults), and capture design direction in the design doc.

---

### Step 5 — Exploration

- **Library Landscape:** Before proposing approaches, search for open-source libraries that already solve the core problem. For each candidate, evaluate: maintenance health (last commit, stars, open issues), licence (MIT/Apache preferred), bundle size, and API fit with the existing stack. Present a short Build vs Borrow table. If a well-maintained library covers ≥80% of the need, default to it over a custom implementation.
- **Batch Task Detection:** If any part of the feature involves processing more than ~10 items of the same type (files, records, API calls, assets), flag it — the implementation should use a CLI script, not manual or UI-driven steps. Note this in the design doc so `/plan` creates a dedicated script task.
- Propose 2-3 different approaches with trade-offs, incorporating viable libraries where appropriate.
- Lead with a recommendation and explain your reasoning.

---

### Step 6 — Present the architecture

Present the validated design in sections:
- Architecture overview
- Components and how they connect
- Tech stack with reasons for each choice
- Data flow
- Error handling and failure modes

After each section, pause and ask: "Does this look right so far?"

---

### Step 7 — Visual validation (if UI needed)

Create a mockup in static HTML. Confirm the mockup with the user **before** moving to planning.

---

### Step 8 — Confirm and document

Summarise the agreed design back to the user. Ask: "Is there anything missing or anything you'd change?"

Once confirmed, write the design document to:
`plans/YYYY-MM-DD-<topic>-design.md`

The design doc must include:
- Goal
- Problem statement
- User journey (step by step, every screen)
- First visit vs returning user flow
- Scope (what we are NOT building)
- Architecture
- Tech stack (with reasons)
- Data model
- Every output field with its source and calculation
- Error handling and edge cases
- Open questions (resolved and unresolved)
- Next steps

---

### Step 9 — Log decisions

Append to `.agent/decisions.log` for each significant design decision made this session:
```
[YYYY-MM-DD] [Phase/Feature] — Decision: <what was chosen>. Rejected: <what was considered>. Because: <the reason>.
```

This log is read by `/plan` at the start of every planning session to prevent re-litigating past decisions.

---

### Step 10 — Update project files

- Update `CLAUDE.md` with the project overview and tech stack
- Update `PROJECT_HISTORY.md` with the session log entry and key decisions made

---

## Output Checklist
- [ ] Design doc written to `plans/YYYY-MM-DD-<topic>-design.md`
- [ ] Every screen documented with its exact contents
- [ ] First visit vs returning user flow documented
- [ ] Every output field documented with source and calculation
- [ ] `CLAUDE.md` updated with project overview and tech stack
- [ ] `PROJECT_HISTORY.md` updated with session log entry
- [ ] `.agent/decisions.log` updated with key decisions
- [ ] All open questions either resolved or explicitly listed
- [ ] Mockup confirmed by user (if UI work)
- [ ] User confirmed the full design before closing

---

## What Good Looks Like
- The user never had to ask "shouldn't we talk about X?" — you raised it first
- The design doc could be handed to a developer who has never spoken to the user and they'd know exactly what to build
- No placeholders remain in any output files
- Every significant decision is logged with its reasoning so it is never re-litigated
- Every screen is documented — a designer could build wireframes from the doc alone
- Every output field is specified — a developer would never have to guess what to show

---

## Lesson Learned (2026-05-04 — Trading Council project)
UX decisions that were missed in brainstorm and only surfaced after v1 was built:
- Position sizing logic (what do small/medium/large actually mean in £?)
- Portfolio entry flow (manual vs upload, confirmation screen)
- Council suggestion screen (every time vs first time only)
- Onboarding explanation text (what does each answer mean?)
- Profile summary at end of onboarding
- Chairman rationale (what does the verdict actually say?)
- Full-width vs narrow layout
- Branded login screen

**These are now covered by the "Every screen", "Outputs and results", and "Data the user manages" question sections above.**

---

## Next Step
Once design and mockup are approved, use `/plan` to create an implementation plan.
