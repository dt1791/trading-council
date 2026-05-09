from backend.database import init_db, get_db
import os

os.environ["DB_PATH"] = "test_portfolio.db"

def test_portfolio_tables_exist():
    init_db()
    conn = get_db()
    cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [row[0] for row in cursor.fetchall()]
    conn.close()
    assert "portfolio_positions" in tables
    assert "verdict_followups" in tables
    assert "portfolio_snapshots" in tables

def test_portfolio_position_insert():
    import uuid
    init_db()
    conn = get_db()
    pos_id = str(uuid.uuid4())
    conn.execute(
        "INSERT INTO portfolio_positions (id, user_id, ticker, shares, entry_price, sector, source) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (pos_id, "test-user", "AAPL", 10, 175.0, "Technology", "manual")
    )
    conn.commit()
    row = conn.execute("SELECT * FROM portfolio_positions WHERE id = ?", (pos_id,)).fetchone()
    conn.close()
    assert row["ticker"] == "AAPL"
    assert row["shares"] == 10
    assert row["sector"] == "Technology"

def test_verdict_followup_insert():
    import uuid
    init_db()
    conn = get_db()
    followup_id = str(uuid.uuid4())
    conn.execute(
        "INSERT INTO verdict_followups (id, verdict_id, user_id, ticker, acted_on, shares_bought, amount_invested, entry_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (followup_id, "test-verdict", "test-user", "AAPL", "yes", 10, 1750.0, 175.0)
    )
    conn.commit()
    row = conn.execute("SELECT * FROM verdict_followups WHERE id = ?", (followup_id,)).fetchone()
    conn.close()
    assert row["acted_on"] == "yes"
    assert row["shares_bought"] == 10