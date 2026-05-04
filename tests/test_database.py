from backend.database import init_db, get_db

def test_tables_exist():
    init_db()
    conn = get_db()
    cursor = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table'"
    )
    tables = [row[0] for row in cursor.fetchall()]
    conn.close()
    assert "users" in tables
    assert "positions" in tables
    assert "persona_analyses" in tables
    assert "council_verdicts" in tables