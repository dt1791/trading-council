import uuid
import json
from datetime import datetime
from backend.database import get_db, init_db


def get_portfolio(user_id: str) -> dict:
    """Get full portfolio with calculated values for a user."""
    init_db()
    conn = get_db()

    positions = conn.execute(
        "SELECT * FROM portfolio_positions WHERE user_id = ? AND status = 'open'",
        (user_id,)
    ).fetchall()

    snapshot = conn.execute(
        "SELECT * FROM portfolio_snapshots WHERE user_id = ? ORDER BY snapshot_date DESC LIMIT 1",
        (user_id,)
    ).fetchone()

    conn.close()

    position_list = []
    total_value = 0.0
    sector_breakdown: dict = {}

    for p in positions:
        current_value = p["shares"] * p["current_price"] if p["current_price"] else p["shares"] * p["entry_price"]
        entry_value = p["shares"] * p["entry_price"]
        pnl = current_value - entry_value
        pnl_pct = (pnl / entry_value * 100) if entry_value > 0 else 0

        total_value += current_value

        sector = p["sector"] or "Unknown"
        sector_breakdown[sector] = sector_breakdown.get(sector, 0) + current_value

        position_list.append({
            "id": p["id"],
            "ticker": p["ticker"],
            "shares": p["shares"],
            "entryPrice": p["entry_price"],
            "currentPrice": p["current_price"],
            "currentValue": round(current_value, 2),
            "pnl": round(pnl, 2),
            "pnlPct": round(pnl_pct, 2),
            "sector": sector,
            "source": p["source"],
            "verdictId": p["verdict_id"],
            "entryDate": p["entry_date"]
        })

    # Calculate sector percentages
    sector_pct = {}
    for sector, value in sector_breakdown.items():
        sector_pct[sector] = round((value / total_value * 100) if total_value > 0 else 0, 1)

    # Cash available
    cash_override = snapshot["cash_override"] if snapshot and snapshot["cash_override"] is not None else None

    return {
        "positions": position_list,
        "totalValue": round(total_value, 2),
        "sectorBreakdown": sector_pct,
        "cashOverride": cash_override,
        "positionCount": len(position_list)
    }


def get_cash_available(user_id: str, profile: dict) -> float:
    """Calculate cash available = stated capital - invested amount, or user override."""
    conn = get_db()
    snapshot = conn.execute(
        "SELECT * FROM portfolio_snapshots WHERE user_id = ? ORDER BY snapshot_date DESC LIMIT 1",
        (user_id,)
    ).fetchone()
    conn.close()

    # User override takes priority
    if snapshot and snapshot["cash_override"] is not None:
        return float(snapshot["cash_override"])

    # Calculate from stated capital minus invested
    stated_capital = float(profile.get("capitalAvailable", 0) or 0)
    if stated_capital == 0:
        return 0.0

    conn = get_db()
    invested = conn.execute(
        "SELECT SUM(shares * entry_price) as total FROM portfolio_positions WHERE user_id = ? AND status = 'open'",
        (user_id,)
    ).fetchone()
    conn.close()

    total_invested = float(invested["total"] or 0)
    return max(0.0, stated_capital - total_invested)


def add_position(user_id: str, ticker: str, shares: float, entry_price: float,
                 sector: str = "Unknown", source: str = "manual",
                 verdict_id: str = None, entry_date: str = None) -> dict:
    """Add a new position to the portfolio."""
    init_db()
    conn = get_db()
    pos_id = str(uuid.uuid4())

    conn.execute(
        """INSERT INTO portfolio_positions 
           (id, user_id, ticker, shares, entry_price, sector, source, verdict_id, entry_date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (pos_id, user_id, ticker, shares, entry_price, sector, source,
         verdict_id, entry_date or datetime.now().isoformat())
    )
    conn.commit()
    conn.close()

    return {"id": pos_id, "ticker": ticker, "shares": shares, "entryPrice": entry_price}


def update_position_price(user_id: str, ticker: str, current_price: float, sector: str = None):
    """Update current price for all open positions in a ticker."""
    conn = get_db()
    if sector:
        conn.execute(
            "UPDATE portfolio_positions SET current_price = ?, current_value = shares * ?, sector = ? WHERE user_id = ? AND ticker = ? AND status = 'open'",
            (current_price, current_price, sector, user_id, ticker)
        )
    else:
        conn.execute(
            "UPDATE portfolio_positions SET current_price = ?, current_value = shares * ? WHERE user_id = ? AND ticker = ? AND status = 'open'",
            (current_price, current_price, user_id, ticker)
        )
    conn.commit()
    conn.close()


def close_position(user_id: str, ticker: str):
    """Mark a position as closed."""
    conn = get_db()
    conn.execute(
        "UPDATE portfolio_positions SET status = 'closed' WHERE user_id = ? AND ticker = ? AND status = 'open'",
        (user_id, ticker)
    )
    conn.commit()
    conn.close()


def record_verdict_followup(verdict_id: str, user_id: str, ticker: str,
                            acted_on: str, shares_bought: float = 0,
                            amount_invested: float = 0, entry_price: float = 0) -> dict:
    """Record whether user acted on a verdict."""
    init_db()
    conn = get_db()
    followup_id = str(uuid.uuid4())

    conn.execute(
        """INSERT INTO verdict_followups
           (id, verdict_id, user_id, ticker, acted_on, shares_bought, amount_invested, entry_price)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (followup_id, verdict_id, user_id, ticker, acted_on, shares_bought, amount_invested, entry_price)
    )

    # Update verdict as followed
    conn.execute(
        "UPDATE council_verdicts SET user_followed = 1 WHERE id = ?",
        (verdict_id,)
    )

    conn.commit()
    conn.close()

    # If user acted on it, add to portfolio
    if acted_on in ["yes", "partial"] and shares_bought > 0:
        add_position(
            user_id=user_id,
            ticker=ticker,
            shares=shares_bought,
            entry_price=entry_price,
            source="verdict",
            verdict_id=verdict_id
        )

    return {"id": followup_id, "actedOn": acted_on}


def get_pending_followups(user_id: str) -> list:
    """Get verdicts that haven't been followed up on yet."""
    conn = get_db()
    rows = conn.execute(
        """SELECT cv.id, cv.action, cv.created_at, cv.confidence,
                  p.ticker, p.entry_price as verdict_price
           FROM council_verdicts cv
           JOIN positions p ON cv.position_id = p.id
           WHERE p.user_id = ? AND cv.user_followed = 0
           ORDER BY cv.created_at DESC
           LIMIT 5""",
        (user_id,)
    ).fetchall()
    conn.close()

    return [{
        "verdictId": r["id"],
        "ticker": r["ticker"],
        "action": r["action"],
        "verdictPrice": r["verdict_price"],
        "verdictDate": r["created_at"],
        "confidence": r["confidence"]
    } for r in rows]


def get_portfolio_context_for_council(user_id: str, ticker: str, profile: dict) -> dict:
    """Build portfolio context to pass into persona prompts."""
    portfolio = get_portfolio(user_id)
    cash = get_cash_available(user_id, profile)

    # Check if user already holds this ticker
    existing_position = next(
        (p for p in portfolio["positions"] if p["ticker"] == ticker), None
    )

    # Sector of this ticker (from profile or will be fetched)
    top_sectors = sorted(
        portfolio["sectorBreakdown"].items(),
        key=lambda x: x[1], reverse=True
    )[:3]

    return {
        "totalPortfolioValue": portfolio["totalValue"],
        "cashAvailable": round(cash, 2),
        "positionCount": portfolio["positionCount"],
        "topSectors": top_sectors,
        "sectorBreakdown": portfolio["sectorBreakdown"],
        "existingPosition": existing_position,
        "allPositions": [
            f"{p['ticker']} ({p['pnlPct']:+.1f}%, {p['sector']})"
            for p in portfolio["positions"]
        ]
    }


def update_cash_override(user_id: str, cash_amount: float):
    """User manually overrides their cash figure."""
    init_db()
    conn = get_db()
    snapshot_id = str(uuid.uuid4())

    # Check if snapshot exists
    existing = conn.execute(
        "SELECT id FROM portfolio_snapshots WHERE user_id = ?",
        (user_id,)
    ).fetchone()

    if existing:
        conn.execute(
            "UPDATE portfolio_snapshots SET cash_override = ? WHERE user_id = ?",
            (cash_amount, user_id)
        )
    else:
        conn.execute(
            "INSERT INTO portfolio_snapshots (id, user_id, cash_override) VALUES (?, ?, ?)",
            (snapshot_id, user_id, cash_amount)
        )

    conn.commit()
    conn.close()


def get_performance(user_id: str) -> dict:
    """Get track record — past verdicts vs outcomes."""
    conn = get_db()

    verdicts = conn.execute(
        """SELECT cv.id, cv.action, cv.confidence, cv.created_at,
                  p.ticker, p.entry_price as verdict_price,
                  pp.current_price, pp.shares, pp.entry_price as actual_entry,
                  vf.acted_on, vf.shares_bought, vf.amount_invested
           FROM council_verdicts cv
           JOIN positions p ON cv.position_id = p.id
           LEFT JOIN portfolio_positions pp ON pp.verdict_id = cv.id
           LEFT JOIN verdict_followups vf ON vf.verdict_id = cv.id
           WHERE p.user_id = ?
           ORDER BY cv.created_at DESC""",
        (user_id,)
    ).fetchall()
    conn.close()

    results = []
    correct = 0
    total_with_outcome = 0

    for v in verdicts:
        verdict_price = v["verdict_price"]
        current_price = v["current_price"]

        outcome = None
        is_correct = None

        if current_price and verdict_price:
            price_change_pct = ((current_price - verdict_price) / verdict_price) * 100
            if v["action"] == "buy" and price_change_pct > 2:
                outcome = f"+{price_change_pct:.1f}%"
                is_correct = True
            elif v["action"] == "sell" and price_change_pct < -2:
                outcome = f"{price_change_pct:.1f}%"
                is_correct = True
            elif v["action"] == "hold" and abs(price_change_pct) < 5:
                outcome = f"{price_change_pct:+.1f}%"
                is_correct = True
            else:
                outcome = f"{price_change_pct:+.1f}%"
                is_correct = False

            total_with_outcome += 1
            if is_correct:
                correct += 1

        results.append({
            "verdictId": v["id"],
            "ticker": v["ticker"],
            "action": v["action"],
            "verdictPrice": verdict_price,
            "currentPrice": current_price,
            "outcome": outcome,
            "isCorrect": is_correct,
            "actedOn": v["acted_on"],
            "confidence": v["confidence"],
            "date": v["created_at"]
        })

    hit_rate = round((correct / total_with_outcome * 100) if total_with_outcome > 0 else 0, 1)

    return {
        "verdicts": results,
        "hitRate": hit_rate,
        "totalVerdicts": len(results),
        "totalWithOutcome": total_with_outcome,
        "correctCalls": correct
    }