from backend.services.council_service import run_chairman

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

def test_chairman_hold_verdict():
    analyses = [
        {"recommendation": "buy", "confidence": 0.6, "weight": 0.5},
        {"recommendation": "sell", "confidence": 0.6, "weight": 0.5},
    ]
    verdict = run_chairman(analyses)
    assert verdict["action"] == "hold"

def test_confidence_is_weighted():
    analyses = [
        {"recommendation": "buy", "confidence": 0.9, "weight": 0.6},
        {"recommendation": "buy", "confidence": 0.5, "weight": 0.4},
    ]
    verdict = run_chairman(analyses)
    assert verdict["confidence"] == round(0.9 * 0.6 + 0.5 * 0.4, 3)