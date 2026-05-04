PERSONAS = {
    "risk_manager": {
        "id": "risk_manager",
        "name": "Risk Manager",
        "mandatory": True,
        "style": "Howard Marks / Seth Klarman",
        "lens": "Preserve capital, limit downside, manage drawdown",
        "focus": "Balance sheet strength, leverage, cash runway, volatility",
        "good": "Strong liquidity, low debt, clear margin of safety",
        "bad": "High leverage, weak cash flow, fragile business model",
        "base_weight": 0.30
    },
    "quant": {
        "id": "quant",
        "name": "Quant/Systematic",
        "mandatory": True,
        "style": "Jim Simons / Cliff Asness",
        "lens": "Data-driven signals, rules-based discipline",
        "focus": "Momentum, factor alignment, volatility, signal consistency",
        "good": "Positive trend, strong factor score, resilient signal history",
        "bad": "Weak trend, poor risk-adjusted returns, unstable behavior",
        "base_weight": 0.25
    },
    "growth_investor": {
        "id": "growth_investor",
        "name": "Growth Investor",
        "mandatory": False,
        "style": "Peter Lynch / Cathie Wood",
        "lens": "Revenue expansion, innovation, market opportunity",
        "focus": "Top-line growth, margin improvement, TAM",
        "good": "Accelerating growth, improving unit economics, strong market share gains",
        "bad": "Slowing growth, unsustainable spending, weak market adoption",
        "base_weight": 0.20
    },
    "macro_strategist": {
        "id": "macro_strategist",
        "name": "Macro Strategist",
        "mandatory": False,
        "style": "Ray Dalio / Paul Tudor Jones",
        "lens": "Economic regime, rates, inflation, geopolitics",
        "focus": "Interest rate outlook, policy impact, sector sensitivity",
        "good": "Stock aligned with macro regime and policy tailwinds",
        "bad": "Stock exposed to recession risk or macro headwinds",
        "base_weight": 0.15
    },
    "value_investor": {
        "id": "value_investor",
        "name": "Value Investor",
        "mandatory": False,
        "style": "Warren Buffett",
        "lens": "Intrinsic value, margin of safety",
        "focus": "Cash flow, valuation multiples, moat, capital allocation",
        "good": "Undervalued quality business with strong economics",
        "bad": "Expensive relative to fundamentals, weak competitive advantage",
        "base_weight": 0.20
    },
    "income_investor": {
        "id": "income_investor",
        "name": "Income/Dividend Investor",
        "mandatory": False,
        "style": "Benjamin Graham / John Bogle",
        "lens": "Cash yield, payout sustainability",
        "focus": "Dividend coverage, payout ratio, business stability",
        "good": "Stable or growing dividends from conservative cash flow",
        "bad": "Dividend pressure, high payout, cyclical earnings",
        "base_weight": 0.20
    },
    "esg_investor": {
        "id": "esg_investor",
        "name": "Ethical/ESG Investor",
        "mandatory": False,
        "style": "ESG-focused funds",
        "lens": "Values alignment, sustainability, governance",
        "focus": "Sector exclusions, ESG behaviour, board quality",
        "good": "Strong values alignment with minimal controversial exposure",
        "bad": "Poor ESG practices or exposure to excluded industries",
        "base_weight": 0.15
    }
}

def select_personas(profile: dict) -> list:
    objective = profile.get("investmentObjective", "growth")
    risk = profile.get("riskAppetite", "balanced")
    ethical = profile.get("ethicalConstraints", "")
    horizon = profile.get("investmentHorizon", "long-term")

    selected = ["risk_manager", "quant"]

    if objective == "growth":
        selected += ["growth_investor", "macro_strategist"]
    elif objective == "income":
        selected += ["income_investor", "value_investor"]
    elif objective == "safety":
        selected += ["value_investor"]

    if ethical and ethical.strip():
        selected.append("esg_investor")

    if risk == "aggressive" and horizon == "short-term":
        if "growth_investor" not in selected:
            selected.append("growth_investor")

    # Compute weights
    personas = []
    for pid in selected:
        p = PERSONAS[pid].copy()
        # Boost risk manager weight for conservative users
        if pid == "risk_manager" and risk == "conservative":
            p["base_weight"] = 0.40
        # Boost growth for aggressive users
        if pid == "growth_investor" and risk == "aggressive":
            p["base_weight"] = 0.30
        personas.append(p)

    # Normalize weights to sum to 1.0
    total = sum(p["base_weight"] for p in personas)
    for p in personas:
        p["weight"] = round(p["base_weight"] / total, 3)

    return personas