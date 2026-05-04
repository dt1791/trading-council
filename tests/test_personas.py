from backend.services.personas import select_personas, PERSONAS

def test_mandatory_personas_always_included():
    profile = {"investmentObjective": "growth", "riskAppetite": "balanced", "ethicalConstraints": "", "investmentHorizon": "long-term"}
    personas = select_personas(profile)
    ids = [p["id"] for p in personas]
    assert "risk_manager" in ids
    assert "quant" in ids

def test_growth_objective():
    profile = {"investmentObjective": "growth", "riskAppetite": "balanced", "ethicalConstraints": "", "investmentHorizon": "long-term"}
    personas = select_personas(profile)
    ids = [p["id"] for p in personas]
    assert "growth_investor" in ids
    assert "macro_strategist" in ids

def test_income_objective():
    profile = {"investmentObjective": "income", "riskAppetite": "conservative", "ethicalConstraints": "", "investmentHorizon": "long-term"}
    personas = select_personas(profile)
    ids = [p["id"] for p in personas]
    assert "income_investor" in ids
    assert "value_investor" in ids

def test_safety_objective_excludes_growth():
    profile = {"investmentObjective": "safety", "riskAppetite": "conservative", "ethicalConstraints": "", "investmentHorizon": "long-term"}
    personas = select_personas(profile)
    ids = [p["id"] for p in personas]
    assert "growth_investor" not in ids

def test_ethical_constraints_adds_esg():
    profile = {"investmentObjective": "growth", "riskAppetite": "balanced", "ethicalConstraints": "no weapons", "investmentHorizon": "long-term"}
    personas = select_personas(profile)
    ids = [p["id"] for p in personas]
    assert "esg_investor" in ids

def test_weights_sum_to_one():
    profile = {"investmentObjective": "growth", "riskAppetite": "aggressive", "ethicalConstraints": "", "investmentHorizon": "long-term"}
    personas = select_personas(profile)
    total = sum(p["weight"] for p in personas)
    assert abs(total - 1.0) < 0.01