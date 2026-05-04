from fastapi.testclient import TestClient
from unittest.mock import patch
from backend.main import app

client = TestClient(app)

def mock_stock_data():
    return {
        "ticker": "AAPL",
        "price": 175.50,
        "change_pct": "1.25%",
        "volume": "50000000",
        "news": [{"title": "Apple news", "url": "https://example.com"}]
    }

def test_get_stock_endpoint():
    with patch("backend.services.stock_service.get_stock_data") as mock:
        mock.return_value = mock_stock_data()
        response = client.get("/stocks/AAPL")
        print(response.json())  # add this
        assert response.status_code == 200

def test_invalid_ticker_returns_404():
    with patch("backend.services.stock_service.get_stock_data") as mock:
        mock.side_effect = ValueError("Ticker not found")
        response = client.get("/stocks/INVALID")
        assert response.status_code == 404