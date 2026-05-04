from fastapi.testclient import TestClient
from unittest.mock import patch
from backend.main import app

client = TestClient(app)

def mock_stock():
    return {
        "ticker": "AAPL",
        "price": 175.50,
        "change_pct": "1.25%",
        "volume": "50000000",
        "news": [{"title": "Apple news", "url": "https://example.com"}]
    }

def mock_verdict():
    return {
        "action": "buy",
        "positionSize": "medium",
        "summary": "3 advisors recommend buy.",
        "confidence": 0.75,
        "personaContributions": []
    }

def test_council_analyse():
    with patch("backend.routers.council.get_stock_data") as mock_stock_fn, \
         patch("backend.routers.council.run_council") as mock_council_fn:
        mock_stock_fn.return_value = mock_stock()
        mock_council_fn.return_value = mock_verdict()

        response = client.post("/council/analyse", json={
            "userId": "test-user-id",
            "ticker": "AAPL",
            "profile": {
                "investmentObjective": "growth",
                "riskAppetite": "balanced",
                "ethicalConstraints": "",
                "investmentHorizon": "long-term"
            }
        })

        assert response.status_code == 200
        data = response.json()
        assert data["action"] in ["buy", "hold", "sell"]
        assert "verdictId" in data
        assert "stock" in data