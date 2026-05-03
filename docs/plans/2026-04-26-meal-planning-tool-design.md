# Meal Planning Tool: Design Document

**Date**: April 26, 2026  
**Duration**: 1 week  
**Status**: Design Phase

---

## Executive Summary

A **web-based meal planning & nutritional tracking tool** that helps you:
1. Build a recipe library from available ingredients
2. Track nutritional intake (macros/micros) against blood report targets
3. Plan weekly meals
4. Monitor ingredient inventory & budget spending
5. Suggest meal adjustments based on nutritional deviations

**Architecture**: React (frontend) + Supabase (backend + PostgreSQL)  
**Target Users**: You (solo), then friends/family (week 2+)

---

## Problem Statement

You need a system to:
- **Decide daily meals** without waste, staying within budget and nutritional targets
- **Track macros/micros** to align with blood report recommendations
- **Reuse recipes** that work, learning from weekly patterns
- **Plan grocery shopping** using Tesco/Chase integration (future)
- **Collaborate** with friends/family eventually

---

## Core Workflows

### Workflow 1: Build Ingredient Inventory
```
User adds ingredient (e.g., "Chicken Breast")
  → App fetches nutrition data (USDA FoodData Central API)
  → Stores: name, quantity, unit, cost, macros/micros per 100g
  → Ingredient available for recipe creation
```

### Workflow 2: Create Recipe from Ingredients
```
User says: "I have chicken, rice, broccoli"
  → App suggests recipe or user manually combines
  → User specifies quantities
  → App auto-calculates total macros/micros
  → Recipe stored with weekly usage counter
```

### Workflow 3: Plan Weekly Meals
```
User assigns recipes to days/meals (Breakfast, Lunch, Dinner, Snacks)
  → Weekly nutritional targets auto-calculated
  → Budget total auto-calculated
  → Plan saved for the week
```

### Workflow 4: Log Actual Consumption
```
User logs: "Today I had Breakfast #1, Lunch #2, Dinner #1, Snack X"
  → App calculates actual macros/micros consumed
  → Compares to planned vs targets
  → Shows: ✓ On target / ✗ Deviated (by how much)
  → Logs for analytics
```

### Workflow 5: Track Budget Spending
```
User has two options:

Option A: Manual Entry (after each shopping trip)
  User enters: "Spent £45 at Waitrose today"
  → App stores: date, amount, merchant, category="groceries"
  → Added to weekly budget total

Option B: CSV Upload (from Chase app)
  User exports Chase transactions → uploads CSV
  → App parses CSV and identifies columns (date, amount, merchant, category)
  → Filters for rows where category="groceries" or merchant contains grocery keywords
  → User reviews extracted transactions before confirming
  → Stores all approved transactions
  → Weekly budget total auto-calculated

Why two methods?
  - Manual entry is quick (2-3 grocery trips per week)
  - CSV bulk-import handles statement reviews (monthly reconciliation)
  - Gives user control over what counts as "groceries"
```

### Workflow 6: View Analytics & Get Suggestions
```
User views dashboard:
  → Daily/weekly nutritional intake vs targets (charts)
  → Budget spent vs cap (from manual entries + CSV transactions)
  → Recipes used this week (auto-ranked)
  → AI suggestions: "You're 15g protein short. Try adding eggs to breakfast."
  → Recommendations for next week's meals
```

---

## Data Model

### Tables (Supabase PostgreSQL)

#### `users`
```
- id (UUID, PK)
- email (unique)
- name
- created_at
- updated_at
```

#### `nutritional_targets`
```
- id (UUID, PK)
- user_id (FK → users)
- protein_min, protein_max (g/day)
- carbs_min, carbs_max (g/day)
- fat_min, fat_max (g/day)
- fiber_min (g/day)
- calories_min, calories_max (kcal/day)
- micronutrients {JSON} - e.g., {"iron": {"min": 8, "max": 27}, ...}
- created_at, updated_at
```

#### `ingredients`
```
- id (UUID, PK)
- user_id (FK → users)
- name (e.g., "Chicken Breast")
- quantity (numeric)
- unit (e.g., "g", "ml", "cup")
- cost_per_unit (GBP, for Tesco tracking)
- macros_per_100g {JSON}
  - {"calories": 165, "protein": 31, "carbs": 0, "fat": 3.6, "fiber": 0}
- micros_per_100g {JSON}
  - {"iron": 0.9, "calcium": 15, "vitamin_c": 0, ...}
- usda_fdc_id (link to USDA database for reference)
- created_at, updated_at
```

#### `recipes`
```
- id (UUID, PK)
- user_id (FK → users)
- name (e.g., "Chicken Rice Broccoli")
- description
- ingredients_list {JSON}
  - [{"ingredient_id": "...", "quantity": 150, "unit": "g"}, ...]
- total_macros {JSON}
  - {"calories": 450, "protein": 45, "carbs": 50, "fat": 8, "fiber": 4}
- total_micros {JSON}
- serves (default 1)
- weekly_usage_count (auto-incremented)
- created_at, updated_at
```

#### `meal_plans`
```
- id (UUID, PK)
- user_id (FK → users)
- week_start_date (Monday)
- status (draft | active | completed)
- created_at, updated_at
```

#### `meal_plan_items`
```
- id (UUID, PK)
- meal_plan_id (FK → meal_plans)
- day_of_week (0-6, Monday=0)
- meal_type (breakfast | lunch | dinner | snack)
- recipe_id (FK → recipes)
- quantity_multiplier (default 1, allows 0.5x, 2x, etc.)
- created_at
```

#### `consumption_logs`
```
- id (UUID, PK)
- user_id (FK → users)
- log_date (date)
- meal_type (breakfast | lunch | dinner | snack)
- recipe_id (FK → recipes, nullable for custom entries)
- quantity_multiplier
- actual_macros {JSON} - what user actually consumed
- deviation {JSON} - comparison to planned
- created_at
```

#### `budget_logs`
```
- id (UUID, PK)
- user_id (FK → users)
- week_start_date
- budget_cap (GBP)
- spent (GBP, sum of all transactions this week)
- created_at, updated_at
```

#### `budget_transactions`
```
- id (UUID, PK)
- user_id (FK → users)
- transaction_date (date)
- merchant (e.g., "Tesco", "Waitrose", "Sainsbury's")
- amount (GBP)
- category (e.g., "groceries", "household")
- source (manual | csv_import)
- notes (optional, user-entered)
- created_at
```

---

## Technical Stack

### Frontend
- **Framework**: React 18 (simple, fast)
- **Styling**: Tailwind CSS
- **Charts**: Recharts (nutrition analytics)
- **State**: TanStack Query (data fetching) + Context API (lightweight)
- **Deployment**: Vercel (free tier, fast deploys)

### Backend
- **Database**: Supabase (PostgreSQL + Auth + Real-time)
- **API**: Supabase REST API (auto-generated from schema)
- **Nutrition Data**: USDA FoodData Central API (free, comprehensive)
- **Auth**: Supabase Auth (email/password, extensible to OAuth)

### Why This Stack?
1. **Speed**: No custom backend to build (Supabase handles REST API auto-generation)
2. **Scalability**: PostgreSQL ready for millions of records
3. **Future-proof**: Auth already built in for friends/family
4. **Free tier**: Sufficient for 1 user MVP
5. **Real-time**: If you want live updates (week 2+)

---

## MVP Scope (Week 1)

### Must-Have (Phase 1: Days 1-3)
- [ ] Supabase project + schema setup
- [ ] User authentication (email/password)
- [ ] Add ingredients to inventory (manual entry + USDA lookup)
- [ ] Create recipes from ingredients
- [ ] View ingredient & recipe lists

### Should-Have (Phase 2: Days 4-5)
- [ ] Create weekly meal plans (drag-and-drop recipes to days)
- [ ] View weekly nutritional totals
- [ ] Budget tracking (calculate meal costs)
- [ ] Basic dashboard (summary cards)

### Nice-to-Have (Phase 3: Day 6-7, if time)
- [ ] Log actual consumption
- [ ] Simple analytics chart (macros vs targets)
- [ ] AI suggestions (basic rule engine)
- [ ] Recipe usage ranking
- [ ] Edit/delete recipes

### Out-of-Scope (Week 2+)
- [ ] Barcode scanning / image recognition
- [ ] Tesco API integration
- [ ] Social sharing / friends' meal plans
- [ ] Mobile app
- [ ] Advanced AI meal recommendations

---

## CSV Parsing Strategy

Since Chase CSV format is unknown, the app will:

1. **User uploads CSV** → App attempts auto-detection:
   - Look for headers: "date", "amount", "merchant", "category"
   - If not found, show UI: "Map your CSV columns" (dropdown selectors)
   
2. **Preview before import**:
   - Display first 5 rows of parsed data
   - User confirms or adjusts column mapping
   - User reviews which rows have category="groceries"
   
3. **Smart filtering**:
   - Filter by category = "groceries" (exact match)
   - Fallback: filter by merchant keywords ("tesco", "sainsbury", "waitrose", "asda", "morrisons", etc.)
   
4. **Store everything**:
   - Save raw merchant name (not normalized)
   - Store source as "csv_import" (vs "manual")

---

## Key Decisions & Tradeoffs

| Decision | Choice | Why | Tradeoff |
|----------|--------|-----|----------|
| Database | Supabase | Fast setup, auth ready, scalable | Cloud dependency |
| Nutrition API | USDA FoodData | Free, comprehensive, 400K+ foods | Requires API calls (but cached) |
| Frontend | React | Component reuse, rich UI, ecosystem | Larger bundle than vanilla JS |
| Recipe Logic | Manual composition | User controls precision | Less automated |
| Budget Tracking | Manual + CSV import | Flexible, user-controlled | Requires CSV column mapping |
| Micronutrients | All 50+ tracked | Complete nutritional picture | More complex DB schema |
| Deployment | Vercel (frontend) + Supabase (backend) | Fully managed, zero DevOps | Less control than self-hosted |

---

## Success Criteria (Definition of Done)

By end of week:
- [ ] You can add 5+ ingredients with nutritional data
- [ ] You can create 3+ recipes from those ingredients
- [ ] You can build a week-long meal plan
- [ ] Dashboard shows weekly nutritional totals
- [ ] Budget total calculated for the week
- [ ] Zero data loss (schema validated, tested)
- [ ] All tests passing (TDD methodology)

---

## Next Steps

Once this design is approved:
1. `/plan` → Break into TDD-ready tasks with test specs
2. `/build` → RED-GREEN-REFACTOR cycle
3. `/audit` → Verify against this design
4. `/closeout` → Document learnings & commit

---

## Questions for Clarification (Optional)

1. **Nutritional precision**: Do you want to track _every_ micronutrient (iron, calcium, B12, etc.) or focus on key ones (protein, carbs, fat, fiber, calories)?
2. **Recipe variants**: If you cook "Chicken Rice" with different ratios, should it be one recipe with adjustable quantities or separate recipes?
3. **Tesco integration timeline**: Should I build a hook for Chase/Tesco data now (JSON import) or ignore it entirely for MVP?

