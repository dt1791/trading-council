import os
import time
import httpx
from dotenv import load_dotenv

load_dotenv()

ALPHA_VANTAGE_KEY = os.getenv("ALPHA_VANTAGE_KEY")
BASE_URL = "https://www.alphavantage.co/query"
CACHE_DURATION = 900  # 15 minutes

_cache = {}

def _is_cache_valid(key: str) -> bool:
    if key not in _cache:
        return False
    return time.time() - _cache[key]["timestamp"] < CACHE_DURATION

def get_stock_data(ticker: str) -> dict:
    cache_key = f"stock_{ticker}"
    if _is_cache_valid(cache_key):
        return _cache[cache_key]["data"]

    # Fetch price data
    price_resp = httpx.get(BASE_URL, params={
        "function": "GLOBAL_QUOTE",
        "symbol": ticker,
        "apikey": ALPHA_VANTAGE_KEY
    })
    price_data = price_resp.json()
    quote = price_data.get("Global Quote", {})

    if not quote:
        raise ValueError(f"Ticker '{ticker}' not found or API limit reached")

    # Fetch news
    news_resp = httpx.get(BASE_URL, params={
        "function": "NEWS_SENTIMENT",
        "tickers": ticker,
        "limit": 5,
        "apikey": ALPHA_VANTAGE_KEY
    })
    news_data = news_resp.json()
    articles = news_data.get("feed", [])
    news = [{"title": a["title"], "url": a["url"]} for a in articles[:5]]

    result = {
        "ticker": ticker,
        "price": float(quote.get("05. price", 0)),
        "change_pct": quote.get("10. change percent", "0%"),
        "volume": quote.get("06. volume", "0"),
        "news": news
    }

    _cache[cache_key] = {"data": result, "timestamp": time.time()}
    return result