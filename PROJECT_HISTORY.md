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

**Before/After:**
```
Before: All 7 personas always run → overwhelming, conflicting output
After:  2 mandatory + 2-3 conditional → focused, relevant council
```

**Impact:** Cleaner output, easier for the chairman to aggregate, more tailored to user.

**What I Learned:** Less is more when it comes to advisory councils. Focus beats coverage.

---

### 2. Stock Data Provider: Alpha Vantage

**The Problem:** Need reliable, free stock data for the experimentation phase.

**The Solution:** Alpha Vantage official API (free tier, 25 calls/day) with aggressive caching.

**Before/After:**
```
Before: Yahoo Finance (unofficial, breaks randomly)
After:  Alpha Vantage (official, documented, clean JSON)
```

**Impact:** Reliable data layer that won't break the app unexpectedly.

**What I Learned:** Always use official APIs even in experimentation — unofficial scraping creates fragile foundations.

---

### 3. Council Reconvene Triggers

**The Problem:** A one-time analysis isn't enough — positions need ongoing monitoring.

**The Solution:** Three user-defined triggers: scheduled interval, price movement ±X%, or manual request.

**Impact:** The app becomes a living advisor, not just a one-shot tool.

**What I Learned:** The real value of an AI advisor is continuity, not just the first recommendation.

---

## Session Log

| Date | What I Did | Key Decisions | Next Steps |
|------|-----------|---------------|------------|
| 2026-05-03 | Completed brainstorm — user journey, architecture, personas, tech stack, data provider | Alpha Vantage for data; React + FastAPI + SQLite stack; mandatory + conditional persona model; 3 reconvene triggers; multi-user from start | Run `/plan` to break into TDD-ready tasks |
