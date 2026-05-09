import os
os.environ["DB_PATH"] = "test_portfolio_svc.db"

from backend.database import init_db
from backend.services.portfolio_service import (
    add_position, get_portfolio, get_cash_available,
    record_verdict_followup, get_pending_followups,
    update_cash_override, get_portfolio_context_for_council
)

def setup_module():
    init_db()

def test_add_and_get_position():
    result = add_position("user1", "AAPL", 10, 175.0, "Technology", "manual")
    assert result["ticker"] == "AAPL"
    portfolio = get_portfolio("user1")
    assert len(portfolio["positions"]) >= 1
    aapl = next(p for p in portfolio["positions"] if p["ticker"] == "AAPL")
    assert aapl["shares"] == 10
    assert aapl["entryPrice"] == 175.0

def test_sector_breakdown():
    add_position("user2", "AAPL", 10, 175.0, "Technology", "manual")
    add_position("user2", "JNJ", 5, 160.0, "Healthcare", "manual")
    portfolio = get_portfolio("user2")
    assert "Technology" in portfolio["sectorBreakdown"]
    assert "Healthcare" in portfolio["sectorBreakdown"]

def test_cash_available_no_capital():
    cash = get_cash_available("user1", {})
    assert cash == 0.0

def test_cash_available_with_capital():
    cash = get_cash_available("user1", {"capitalAvailable": 10000})
    assert cash < 10000  # Should be reduced by invested amount

def test_cash_override():
    update_cash_override("user3", 5000.0)
    cash = get_cash_available("user3", {"capitalAvailable": 10000})
    assert cash == 5000.0

def test_portfolio_context():
    add_position("user4", "NVDA", 20, 500.0, "Technology", "manual")
    context = get_portfolio_context_for_council("user4", "NVDA", {"capitalAvailable": 20000})
    assert context["existingPosition"] is not None
    assert context["existingPosition"]["ticker"] == "NVDA"
    assert "Technology" in context["sectorBreakdown"]