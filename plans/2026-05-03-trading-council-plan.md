# Implementation Plan: Trading Council v1

**Date:** 2026-05-03
**Goal:** Build a full-stack web app where a council of AI personas analyses stocks based on the user's financial profile and delivers a chairman verdict with portfolio tracking over time.

**Architecture:**
- React frontend (Vercel) communicates with a FastAPI backend (Render) via REST API.
- SQLite database stores user profiles, positions, persona analyses, and verdicts.
- Each persona is powered by a Claude API call with a tailored system prompt.
- Alpha Vantage provides live stock price and news data, cached to conserve API quota.

**Design Patterns:** Repository pattern for data access, Strategy pattern for persona engines, Factory pattern for persona selection.

**Tech Stack:** React, Python, FastAPI, SQLite, Anthropic Claude API, Alpha Vantage API, Vercel, Render.

**Approved mockup:** See trading_council_mockup widget from brainstorm session.

---

## Block 1: Project Setup & Folder Structure

**Success criteria:**
- [ ] Frontend React app runs locally
- [ ] Backend FastAPI server runs locally
- [ ] Both can talk to each other (CORS configured)
- [ ] Environment variables set up and gitignored
- [ ] SQLite database initialises on first run

### Chunk 1.1 — Backend scaffold

**Files:** Create `backend/main.py`, `backend/database.py`, `backend/requirements.txt`, `backend/.env.example`, `.gitignore`

**Step 1: Write failing test**
```python
# tests/test_health.py
from fastapi.testclient import TestClient
from backend.main import app

def test_health_check():
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
```

**Step 2: Verify failure**
```bash
cd backend && pip install -r requirements.txt
pytest tests/test_health.py
# Expected: ImportError or 404
```

**Step 3: Implement**
```python
# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.get("/health")
def health():
    return {"status": "ok"}
```

**Step 4: Verify pass**
```bash
pytest tests/test_health.py
# Expected: 1 passed
```

**Step 5: Commit**
```bash
git add . && git commit -m "Setup: scaffold FastAPI backend with health endpoint"
```

---

### Chunk 1.2 — Database initialisation

**Files:** Create `backend/database.py`, `backend/models.py`

**Step 1: Write failing test**
```python
# tests/test_database.py
from backend.database import init_db, get_db
import sqlite3

def test_tables_exist():
    init_db()
    conn = get_db()
    cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [row[0] for row in cursor.fetchall()]
    assert "users" in tables
    assert "positions" in tables
    assert "persona_analyses" in tables
    assert "council_verdicts" in tables
```

**Step 2: Verify failure**
```bash
pytest tests/test_database.py
# Expected: ImportError
```

**Step 3: Implement** — Create `init_db()` that creates all four tables with correct columns from the data model in the design doc.

**Step 4: Verify pass**
```bash
pytest tests/test_database.py
# Expected: 1 passed
```

**Step 5: Commit**
```bash
git add . && git commit -m "Setup: SQLite database init with all tables"
```

---

### Chunk 1.3 — Frontend scaffold

**Files:** Create React app in `frontend/`

**Step 1:**
```bash
cd frontend && npx create-react-app . --template typescript
npm start
# Expected: React app runs on localhost:3000
```

**Step 2: Verify backend connection**
```javascript
// src/api.ts
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
export const healthCheck = () => fetch(`${API_URL}/health`).then(r => r.json());
```

**Step 3: Commit**
```bash
git add . && git commit -m "Setup: scaffold React frontend"
```

---

## Block 2: User Onboarding

**Success criteria:**
- [ ] New user sees onboarding questions on first visit
- [ ] Profile saved to database
- [ ] Returning user skips onboarding and goes straight to main screen
- [ ] All 7 profile fields captured

### Chunk 2.1 — User profile API

**Files:** Create `backend/routers/users.py`

**Step 1: Write failing test**
```python
# tests/test_users.py
def test_create_user_profile(client):
    response = client.post("/users", json={
        "riskAppetite": "balanced",
        "investmentHorizon": "long-term",
        "capitalAvailable": 10000,
        "income": 50000,
        "existingPortfolio": "60% stocks, 40% bonds",
        "ethicalConstraints": "no tobacco",
        "investmentObjective": "growth"
    })
    assert response.status_code == 201
    assert "id" in response.json()
```

**Step 2: Verify failure** → 404 (route doesn't exist yet)

**Step 3: Implement** — Create POST `/users` endpoint that saves to `users` table and returns the new user id.

**Step 4: Verify pass** → 1 passed

**Step 5: Commit**
```bash
git add . && git commit -m "Feature: user profile creation API"
```

---

### Chunk 2.2 — Onboarding UI

**Files:** Create `frontend/src/pages/Onboarding.tsx`, `frontend/src/components/ProfileForm.tsx`

- One question per screen (step-by-step wizard)
- Progress indicator at top
- On completion, save profile via API and redirect to main screen
- Store user id in localStorage

**Step 1: Write test**
```javascript
// src/__tests__/Onboarding.test.tsx
test('renders first onboarding question', () => {
  render(<Onboarding />);
  expect(screen.getByText(/what is your investment objective/i)).toBeInTheDocument();
});
```

**Step 5: Commit**
```bash
git add . && git commit -m "Feature: onboarding wizard UI"
```

---

## Block 3: Stock Data Layer

**Success criteria:**
- [ ] Given a ticker, returns current price and % change
- [ ] Returns up to 5 recent news article links
- [ ] Results cached for 15 minutes to conserve API quota
- [ ] Graceful error if ticker not found or API limit hit

### Chunk 3.1 — Alpha Vantage integration

**Files:** Create `backend/services/stock_service.py`

**Step 1: Write failing test**
```python
# tests/test_stock_service.py
import pytest
from unittest.mock import patch
from backend.services.stock_service import get_stock_data

@pytest.mark.skipif(not os.environ.get("RUN_LIVE_TESTS"), reason="live API test")
def test_get_stock_data_live():
    data = get_stock_data("AAPL")
    assert "price" in data
    assert "change_pct" in data
    assert "news" in data

def test_get_stock_data_cached(mock_alpha_vantage):
    data = get_stock_data("AAPL")
    assert data["price"] > 0
```

**Step 2: Verify failure** → ImportError

**Step 3: Implement** — `get_stock_data(ticker)` calls Alpha Vantage, caches result for 15 mins, returns `{price, change_pct, news: [{title, url}]}`.

**Step 5: Commit**
```bash
git add . && git commit -m "Feature: Alpha Vantage stock data service with caching"
```

---

### Chunk 3.2 — Stock data API endpoint

**Files:** Create `backend/routers/stocks.py`

**Step 1: Write failing test**
```python
def test_get_stock_endpoint(client):
    response = client.get("/stocks/AAPL")
    assert response.status_code == 200
    data = response.json()
    assert "price" in data
    assert "news" in data
```

**Step 5: Commit**
```bash
git add . && git commit -m "Feature: stock data API endpoint"
```

---

## Block 4: Persona Engine

**Success criteria:**
- [ ] Given a user profile, returns the correct set of personas with weights
- [ ] Each persona analyses a stock and returns structured output
- [ ] Mandatory personas always included
- [ ] Conditional personas correctly selected based on objective

### Chunk 4.1 — Persona selection logic

**Files:** Create `backend/services/persona_service.py`

**Step 1: Write failing test**
```python
# tests/test_persona_service.py
from backend.services.persona_service import select_personas

def test_growth_objective_includes_growth_investor():
    profile = {"investmentObjective": "growth", "riskAppetite": "aggressive", "ethicalConstraints": ""}
    personas = select_personas(profile)
    names = [p["id"] for p in personas]
    assert "risk_manager" in names
    assert "quant" in names
    assert "growth_investor" in names
    assert "macro_strategist" in names

def test_safety_objective_excludes_growth_investor():
    profile = {"investmentObjective": "safety", "riskAppetite": "conservative", "ethicalConstraints": ""}
    personas = select_personas(profile)
    names = [p["id"] for p in personas]
    assert "growth_investor" not in names

def test_ethical_constraints_adds_esg():
    profile = {"investmentObjective": "growth", "riskAppetite": "balanced", "ethicalConstraints": "no weapons"}
    personas = select_personas(profile)
    names = [p["id"] for p in personas]
    assert "esg_investor" in names
```

**Step 2: Verify failure** → ImportError

**Step 3: Implement** — `select_personas(profile)` returns list of persona definitions with weights computed from profile.

**Step 4: Verify pass** → 3 passed

**Step 5: Commit**
```bash
git add . && git commit -m "Feature: persona selection logic with weighting"
```

---

### Chunk 4.2 — Persona analysis via Claude API

**Files:** Create `backend/services/council_service.py`

**Step 1: Write failing test**
```python
# tests/test_council_service.py
from unittest.mock import patch
from backend.services.council_service import run_persona_analysis

def test_persona_analysis_returns_structured_output(mock_claude):
    result = run_persona_analysis(
        persona={"id": "risk_manager", "name": "Risk Manager", "style": "Howard Marks"},
        stock={"ticker": "AAPL", "price": 175.0, "news": []},
        profile={"riskAppetite": "balanced"}
    )
    assert result["recommendation"] in ["buy", "hold", "sell"]
    assert 0 <= result["confidence"] <= 1
    assert "reasoning" in result
    assert result["positionSize"] in ["small", "medium", "large"]
```

**Step 2: Verify failure** → ImportError

**Step 3: Implement** — `run_persona_analysis()` calls Claude API with a persona system prompt. Parse response into structured output. Handle timeout (30s) and fallback if Claude fails.

**Step 5: Commit**
```bash
git add . && git commit -m "Feature: persona analysis via Claude API"
```

---

### Chunk 4.3 — Chairman aggregation

**Files:** Add `run_chairman()` to `backend/services/council_service.py`

**Step 1: Write failing test**
```python
def test_chairman_buy_verdict():
    analyses = [
        {"recommendation": "buy", "confidence": 0.9, "weight": 0.4},
        {"recommendation": "buy", "confidence": 0.8, "weight": 0.35},
        {"recommendation": "hold", "confidence": 0.7, "weight": 0.25},
    ]
    verdict = run_chairman(analyses)
    assert verdict["action"] == "buy"
    assert "summary" in verdict
    assert verdict["positionSize"] in ["small", "medium", "large"]

def test_chairman_sell_verdict():
    analyses = [
        {"recommendation": "sell", "confidence": 0.85, "weight": 0.5},
        {"recommendation": "sell", "confidence": 0.75, "weight": 0.3},
        {"recommendation": "hold", "confidence": 0.6, "weight": 0.2},
    ]
    verdict = run_chairman(analyses)
    assert verdict["action"] == "sell"
```

**Step 3: Implement** — Convert recommendations to numeric signals (buy=+1, hold=0, sell=-1), apply weights, compute weighted average, map back to action. Use Claude API to generate the summary paragraph.

**Step 5: Commit**
```bash
git add . && git commit -m "Feature: chairman aggregation logic"
```

---

## Block 5: Council API Endpoints

**Success criteria:**
- [ ] POST `/council/analyse` triggers full council run and returns verdict
- [ ] Verdict saved to database
- [ ] User can retrieve past verdicts

### Chunk 5.1 — Council analyse endpoint

**Files:** Create `backend/routers/council.py`

**Step 1: Write failing test**
```python
def test_council_analyse(client):
    response = client.post("/council/analyse", json={
        "userId": "test-user-id",
        "ticker": "AAPL"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["action"] in ["buy", "hold", "sell"]
    assert "personaContributions" in data
    assert len(data["personaContributions"]) >= 2
```

**Step 5: Commit**
```bash
git add . && git commit -m "Feature: council analyse API endpoint"
```

---

## Block 6: Main UI

**Success criteria:**
- [ ] Stock ticker input and "Convene council" button
- [ ] Live price and news links display
- [ ] Persona cards show individual verdicts and weights
- [ ] Chairman verdict panel with confidence bar
- [ ] Edit council mix button works
- [ ] Loading states during analysis

### Chunk 6.1 — Main dashboard page

**Files:** Create `frontend/src/pages/Dashboard.tsx`, `frontend/src/components/StockBar.tsx`, `frontend/src/components/StockInfo.tsx`

**Step 1: Write test**
```javascript
test('renders stock input and convene button', () => {
  render(<Dashboard />);
  expect(screen.getByPlaceholderText(/enter ticker/i)).toBeInTheDocument();
  expect(screen.getByText(/convene council/i)).toBeInTheDocument();
});
```

**Step 5: Commit**
```bash
git add . && git commit -m "Feature: main dashboard UI with stock input"
```

---

### Chunk 6.2 — Persona cards

**Files:** Create `frontend/src/components/PersonaCard.tsx`, `frontend/src/components/CouncilGrid.tsx`

- Show persona name, style reference, recommendation pill, confidence, reasoning, weight bar
- Required badge for mandatory personas
- Edit council mix modal to add/remove conditional personas with warning messages

**Step 5: Commit**
```bash
git add . && git commit -m "Feature: persona cards and council grid"
```

---

### Chunk 6.3 — Chairman verdict panel

**Files:** Create `frontend/src/components/ChairmanVerdict.tsx`

- Show BUY/HOLD/SELL in large text
- Position size guidance
- Summary paragraph
- Confidence bar
- Loading skeleton during analysis

**Step 5: Commit**
```bash
git add . && git commit -m "Feature: chairman verdict panel"
```

---

## Block 7: Portfolio Tracking

**Success criteria:**
- [ ] User can log a decision (buy/hold/sell) after a verdict
- [ ] Open positions shown on a portfolio page
- [ ] Reconvene triggers configurable per position
- [ ] Trigger fires and queues a new analysis

### Chunk 7.1 — Position logging API

**Files:** Create `backend/routers/positions.py`

**Step 1: Write failing test**
```python
def test_log_position(client):
    response = client.post("/positions", json={
        "userId": "test-user",
        "ticker": "NVDA",
        "entryPrice": 875.40,
        "quantity": 10,
        "verdictId": "test-verdict-id",
        "userFollowed": True
    })
    assert response.status_code == 201
    assert "id" in response.json()
```

**Step 5: Commit**
```bash
git add . && git commit -m "Feature: position logging API"
```

---

### Chunk 7.2 — Reconvene trigger service

**Files:** Create `backend/services/trigger_service.py`

**Step 1: Write failing test**
```python
def test_price_trigger_fires_when_threshold_met():
    position = {"entryPrice": 100.0, "triggerSettings": {"priceMovePct": 10}}
    current_price = 112.0
    assert should_trigger(position, current_price) == True

def test_price_trigger_does_not_fire_below_threshold():
    position = {"entryPrice": 100.0, "triggerSettings": {"priceMovePct": 10}}
    current_price = 105.0
    assert should_trigger(position, current_price) == False
```

**Step 5: Commit**
```bash
git add . && git commit -m "Feature: reconvene trigger logic"
```

---

### Chunk 7.3 — Portfolio UI

**Files:** Create `frontend/src/pages/Portfolio.tsx`

- List open positions with entry price, current price, P&L
- Reconvene trigger settings per position
- "Reconvene now" manual button
- Link to past verdicts for each position

**Step 5: Commit**
```bash
git add . && git commit -m "Feature: portfolio tracking UI"
```

---

## Block 8: Auth & Multi-user

**Success criteria:**
- [ ] User can register with email and password
- [ ] User can log in and receive a session token
- [ ] All API endpoints require authentication
- [ ] Each user only sees their own data

### Chunk 8.1 — Auth endpoints

**Files:** Create `backend/routers/auth.py`, `backend/services/auth_service.py`

- POST `/auth/register` — create user account
- POST `/auth/login` — return JWT token
- Middleware to validate JWT on protected routes

**Step 5: Commit**
```bash
git add . && git commit -m "Feature: user auth with JWT"
```

---

### Chunk 8.2 — Auth UI

**Files:** Create `frontend/src/pages/Login.tsx`, `frontend/src/pages/Register.tsx`

- Simple email/password forms
- Store JWT in localStorage
- Redirect to onboarding after register, dashboard after login

**Step 5: Commit**
```bash
git add . && git commit -m "Feature: login and register UI"
```

---

## Block 9: Deployment

**Success criteria:**
- [ ] Backend deployed to Render and accessible via public URL
- [ ] Frontend deployed to Vercel and accessible via public URL
- [ ] Both connected and working end-to-end in production
- [ ] Environment variables set in both platforms

### Chunk 9.1 — Backend deployment

1. Create `render.yaml` with build and start commands
2. Push to GitHub
3. Connect repo to Render
4. Set env vars: `ANTHROPIC_API_KEY`, `ALPHA_VANTAGE_KEY`, `JWT_SECRET`

### Chunk 9.2 — Frontend deployment

1. Push to GitHub
2. Connect repo to Vercel
3. Set env var: `REACT_APP_API_URL` = your Render backend URL

---

## Technical Debt to Watch

- SQLite will need to migrate to PostgreSQL if user base grows
- Alpha Vantage 25 calls/day limit — caching is critical, monitor usage
- JWT stored in localStorage is not ideal for production security — migrate to httpOnly cookies later
- Persona analyses run sequentially for now — parallelise in v2 for speed

---

## Environment Variables Required

| Variable | Used by | Where to set |
|---|---|---|
| `ANTHROPIC_API_KEY` | Backend | `.env` + Render |
| `ALPHA_VANTAGE_KEY` | Backend | `.env` + Render |
| `JWT_SECRET` | Backend | `.env` + Render |
| `REACT_APP_API_URL` | Frontend | `.env.local` + Vercel |

All `.env` files must be in `.gitignore` before first commit.

---

## Build Order Summary

1. Block 1 — Project setup
2. Block 8 — Auth (needed before anything else is secured)
3. Block 2 — Onboarding
4. Block 3 — Stock data
5. Block 4 — Persona engine
6. Block 5 — Council API
7. Block 6 — Main UI
8. Block 7 — Portfolio tracking
9. Block 9 — Deployment

---

Ready to start building? Run `/build` to begin with Block 1.
