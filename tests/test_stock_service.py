import pytest
from unittest.mock import patch, MagicMock
from backend.services.stock_service import get_stock_data, _cache

def mock_price_response():
    mock = MagicMock()
    mock.json.return_value = {
        "Global Quote": {
            "01. symbol": "AAPL",
            "05. price": "175.50",
            "10. change percent": "1.25%",
            "06. volume": "50000000"
        }
    }
    return mock

def mock_news_response():
    mock = MagicMock()
    mock.json.return_value = {
        "feed": [
            {"title": "Apple hits record", "url": "https://example.com/1"},
            {"title": "Apple earnings beat", "url": "https://example.com/2"}
        ]
    }
    return mock

def test_get_stock_data_returns_correct_structure():
    _cache.clear()
    with patch("httpx.get") as mock_get:
        mock_get.side_effect = [mock_price_response(), mock_news_response()]
        data = get_stock_data("AAPL")
        assert data["ticker"] == "AAPL"
        assert data["price"] == 175.50
        assert "change_pct" in data
        assert isinstance(data["news"], list)
        assert len(data["news"]) == 2
        assert "title" in data["news"][0]
        assert "url" in data["news"][0]

def test_get_stock_data_uses_cache():
    _cache.clear()
    with patch("httpx.get") as mock_get:
        mock_get.side_effect = [mock_price_response(), mock_news_response()]
        get_stock_data("AAPL")
        get_stock_data("AAPL")  # second call should use cache
        assert mock_get.call_count == 2  # only called once for price + news

def test_invalid_ticker_raises_error():
    _cache.clear()
    with patch("httpx.get") as mock_get:
        mock = MagicMock()
        mock.json.return_value = {"Global Quote": {}}
        mock_get.return_value = mock
        with pytest.raises(ValueError):
            get_stock_data("INVALID123")