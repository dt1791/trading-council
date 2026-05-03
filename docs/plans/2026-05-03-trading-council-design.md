# Trading Council Design

**Date:** 2026-05-03
**Status:** Draft — Brainstorm Complete

---

## Goal

Design a multi-persona trading council that evaluates a stock using several expert perspectives, weights their advice based on user-specific financial profile inputs, and produces a chairman verdict recommending buy, hold, or sell plus position sizing guidance. The app tracks portfolio positions over time and reconvenes the council based on user-defined triggers.

---

## Problem Statement

Individual trading advice can be overly narrow. A council of personas protects against single-view bias by combining diverse analytic styles. The system must adapt to each user's risk appetite, investment horizon, capital, and personal constraints so the final recommendation matches the user's situation — and continues to monitor those positions over time.

---

## User Journey

1. **Onboarding** — app asks questions to understand the user's financial profile (risk appetite, horizon, capital, objective, ethical constraints etc.)
2. **Stock input** — user enters a ticker symbol
3. **Council suggestion** — app proposes which personas to activate based on their profile, and explains why each was chosen
4. **Council editing** — user can add/remove personas; the app warns what each change means (e.g. "removing Risk Manager means downside risk won't be assessed")
5. **Live data fetch** — app pulls current price, recent news links, and key facts about the stock
6. **Persona analysis** — each council member analyses the stock using live data and their own lens; news links are surfaced where relevant in each persona's view
7. **Chairman verdict** — aggregates all persona outputs into a final buy/hold/sell recommendation with position sizing and rationale
8. **Decision logging** — user records whether they acted on the verdict (buy/hold/sell/ignore)
9. **Portfolio tracking** — app tracks owned positions: ticker, entry price, quantity, date
10. **Periodic check-ins** — council reconvenes on existing positions based on user-defined triggers
11. **Performance review** — over time, user can see how council advice performed vs actual outcomes

---

## Council Reconvene Triggers

User can set one or more of the following per position:
- **Scheduled interval** — e.g. weekly, monthly
- **Price movement** — e.g. stock moves ±X% from entry
- **Manual request** — user explicitly requests a new analysis

When reconvening, the council sees its previous verdict and checks whether the user followed that advice or would like to update what they did.

---

## High-level Architecture

1. **User Intake**
   - Collect core inputs:
     - risk appetite
     - investment horizon
     - capital available
     - income
     - existing portfolio summary
     - ethical constraints
     - investment objective

   - Investment objective definitions:
     - `growth` — prioritize long-term capital appreciation and market opportunity
     - `income` — prioritize steady cash flow, dividends, and lower volatility
     - `safety` — prioritize capital preservation and downside protection

2. **Persona Engines**
   - Multiple personas, each with its own analytic style
   - Mandatory personas always included; conditional personas based on user profile

3. **Weight Computation**
   - Translate user inputs into persona weights using a rules-based scoring function
   - Weights normalize to 1.0 across the active council

4. **Live Data Layer**
   - Fetch current price and fundamentals via Alpha Vantage API
   - Fetch recent news links (displayed per persona where relevant)
   - Cache results to conserve API quota (25 calls/day on free tier)

5. **Persona Analysis**
   - Each persona evaluates the stock in parallel
   - Structured output per persona:
     - recommendation: buy / hold / sell
     - rationale summary
     - key risks and catalysts
     - suggested position size guidance
     - confidence score
     - relevant news links

6. **Chairman Aggregation**
   - Combines persona outputs using computed weights
   - Resolves conflicts and generates final recommendation
   - Final output:
     - action: buy / hold / sell
     - suggested position size
     - aggregated rationale
     - confidence and risk summary

---

## Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Frontend | React (JavaScript) | Largest community, most tutorials, beginner-friendly |
| Backend | Python + FastAPI | Simple, readable, great for AI integrations |
| Database | SQLite (to start) | Free, no setup, file-based — easy to migrate later |
| AI / Personas | Anthropic Claude API | Powers each persona with a tailored prompt |
| Stock Data | Alpha Vantage API | Free tier (25 calls/day), official, reliable, clean JSON |
| News | Alpha Vantage News + links | Links only — summaries handled by persona prompts |
| Frontend hosting | Vercel | Free tier, easy React deployment |
| Backend hosting | Render | Free tier, supports Python/FastAPI |

---

## Data Model

### UserProfile
- `id`: string
- `riskAppetite`: enum(`conservative`, `balanced`, `aggressive`)
- `investmentHorizon`: enum(`short-term`, `medium-term`, `long-term`)
- `capitalAvailable`: number
- `income`: number
- `existingPortfolio`: string
- `ethicalConstraints`: string
- `investmentObjective`: enum(`growth`, `income`, `safety`)

### Position
- `id`: string
- `userId`: string
- `ticker`: string
- `entryPrice`: number
- `quantity`: number
- `entryDate`: date
- `status`: enum(`open`, `closed`)
- `triggerSettings`: object (interval / priceMovePct / manual)

### PersonaDefinition
- `id`: string
- `name`: string
- `description`: string
- `style`: string
- `baseWeight`: number
- `scoreRules`: object
- `mandatory`: boolean

### PersonaAnalysis
- `id`: string
- `positionId`: string
- `personaId`: string
- `recommendation`: enum(`buy`, `hold`, `sell`)
- `reasoning`: string
- `riskFactors`: string[]
- `positionSize`: enum(`small`, `medium`, `large`)
- `confidence`: number
- `weight`: number
- `newsLinks`: string[]
- `createdAt`: datetime

### CouncilVerdict
- `id`: string
- `positionId`: string
- `action`: enum(`buy`, `hold`, `sell`)
- `positionSize`: enum(`small`, `medium`, `large`)
- `summary`: string
- `confidence`: number
- `personaContributions`: PersonaAnalysis[]
- `createdAt`: datetime
- `userFollowed`: boolean (did the user act on this verdict?)

---

## Persona Selection Matrix

### Mandatory personas (always active)
- `Risk Manager` — always checks downside, leverage, and resilience
- `Quant/Systematic` — always provides an objective data-driven signal

### Conditional personas
| User objective | Additional personas |
|---|---|
| growth | Growth Investor, Macro Strategist |
| income | Income/Dividend Investor, Value Investor |
| safety | Value Investor + extra weight to Risk Manager |
| ethical constraints present | Ethical/ESG Investor |
| aggressive / short-term | Momentum/Technical (optional) |

---

## Persona Definitions

- **Risk Manager** (mandatory)
  - Lens: preserve capital, limit downside, manage drawdown
  - Focus: balance sheet strength, leverage, cash runway, volatility
  - Style: Howard Marks / Seth Klarman

- **Quant/Systematic** (mandatory)
  - Lens: data-driven signals, rules-based discipline
  - Focus: momentum, factor alignment, volatility, signal consistency
  - Style: Jim Simons / Cliff Asness

- **Macro Strategist**
  - Lens: economic regime, rates, inflation, geopolitics
  - Focus: interest rate outlook, policy impact, sector sensitivity
  - Style: Ray Dalio / Paul Tudor Jones

- **Value Investor**
  - Lens: intrinsic value, margin of safety
  - Focus: cash flow, valuation multiples, moat, capital allocation
  - Style: Warren Buffett

- **Growth Investor**
  - Lens: revenue expansion, innovation, market opportunity
  - Focus: top-line growth, margin improvement, TAM
  - Style: Peter Lynch / Cathie Wood

- **Income/Dividend Investor**
  - Lens: cash yield, payout sustainability
  - Focus: dividend coverage, payout ratio, business stability
  - Style: Benjamin Graham / John Bogle

- **Ethical/ESG Investor**
  - Lens: values alignment, sustainability, governance
  - Focus: sector exclusions, ESG behaviour, board quality
  - Style: ESG-focused funds

---

## Persona Weighting Strategy

- Conservative users: higher weight to Risk Manager, Income/Dividend Investor
- Aggressive users: higher weight to Growth Investor, Macro Strategist
- Short-term horizon: higher weight to Quant/Systematic
- Safety objective: extra weight to Risk Manager

Chairman signal aggregation:
- `buy = +1`, `hold = 0`, `sell = -1`
- Apply persona weight to each signal
- Compute weighted average
- Map back to `buy` / `hold` / `sell`
- Determine position size from aggregate strength and confidence

---

## Multi-user & Auth

- App supports multiple users from the start
- User accounts required (email + password to start)
- Free during experimentation phase — no payment/subscription
- Each user has their own profile, positions, and council history

---

## Open Questions (Resolved)

| Question | Decision |
|---|---|
| What models power personas? | Anthropic Claude API (same model, different system prompts) |
| Dynamic persona selection per stock category? | Not in v1 — user profile drives selection |
| Missing/low-confidence persona outputs? | To be defined in planning phase |
| Portfolio concentration limits in chairman? | To be defined in planning phase |

---

## Next Steps

1. Run `/plan` to break this into TDD-ready implementation tasks
2. Define initial persona prompt templates
3. Build core council engine with unit tests
4. Add user intake form
5. Add portfolio tracking and trigger system
6. Add Alpha Vantage integration
7. Build chairman aggregation logic
8. Deploy to Vercel + Render
