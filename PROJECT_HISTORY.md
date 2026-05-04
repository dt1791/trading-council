# Project History

**Project Goal:** Build a multi-persona AI trading council web app that evaluates stocks from multiple expert perspectives, weighted by the user's financial profile, and tracks portfolio performance over time.

**Target Audience:** Individual investors and traders who want more structured, multi-angle analysis before making buy/hold/sell decisions. Free during experimentation phase.

---

## Core Philosophy

### The Problem This Solves

Individual trading decisions are often driven by a single perspective or emotional bias. Getting advice from one source — whether a friend, a single analyst, or one AI — misses blind spots.

**Before this project:**
- Investors rely on a single viewpoint or gut feeling
- No structured way to weigh different investment styles against personal circumstances
- No memory of past advice or tracking of whether advice was good

**After this project:**
- A council of AI personas each bring a distinct investment lens
- Advice is weighted to match the user's risk appetite, horizon, and objectives
- The app tracks positions over time and reconvenes the council when triggered

---

## Key Design Decisions

### 1. Persona Selection Matrix

**The Problem:** Including every persona for every user creates noise and conflicting signals.

**The Solution:** Two mandatory personas (Risk Manager, Quant/Systematic) always run. Conditional personas are activated based on the user's investment objective and preferences.

**Impact:** Cleaner output, easier for the chairman to aggregate, more tailored to user.

**What I Learned:** Less is more when it comes to advisory councils. Focus beats coverage.

---

### 2. Stock Data Provider: Alpha Vantage

**The Problem:** Need reliable, free stock data for the experimentation phase.

**The Solution:** Alpha Vantage official API (free tier, 25 calls/day) with aggressive caching.

**Impact:** Reliable data layer that won't break the app unexpectedly.

**What I Learned:** Always use official APIs even in experimentation — unofficial scraping creates fragile foundations.

---

### 3. Council Reconvene Triggers

**The Problem:** A one-time analysis isn't enough — positions need ongoing monitoring.

**The Solution:** Three user-defined triggers: scheduled interval, price movement ±X%, or manual request.

**Impact:** The app becomes a living advisor, not just a one-shot tool.

**What I Learned:** The real value of an AI advisor is continuity, not just the first recommendation.

---

### 4. UX Decisions Made During Build (Lesson Learned)

**The Problem:** Several important UX decisions only surfaced after the app was partially built — things like position sizing logic, portfolio entry, council suggestion screen behaviour, and onboarding explanations.

**The Solution:** Captured and implemented as a UX improvement sprint after v1 was working.

**What I Learned:** The brainstorm workflow must explicitly ask about every screen the user sees, first vs returning user flows, what each output actually contains, and how users manage their data over time. These questions have been added to the brainstorm workflow for future projects.

---

## Session Log

| Date | What I Did | Key Decisions | Next Steps |
|------|-----------|---------------|------------|
| 2026-05-03 | Completed brainstorm — user journey, architecture, personas, tech stack, data provider | Alpha Vantage for data; React + FastAPI + SQLite stack; mandatory + conditional persona model; 3 reconvene triggers; multi-user from start | Run `/plan` to break into TDD-ready tasks |
| 2026-05-04 | Built Block 1-6: setup, auth, stock data, persona engine, council API, main UI. App working end-to-end with real OpenRouter AI analysis | OpenRouter free tier for all personas; JSON extraction fix for inconsistent model outputs; full TDD with 22 passing tests | UX improvement sprint: 9 improvements identified and logged in decisions.log |
| 2026-05-04 | UX review session — identified 9 improvements needed after seeing v1 working | Council suggestion screen every time; onboarding once only; position sizing with £ amounts; chairman AI rationale; full-width layout; branded login; portfolio entry with PDF upload | Implement all 9 UX improvements, then Block 7 portfolio tracking, then deployment |
