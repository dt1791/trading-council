import sqlite3
import os

DB_PATH = os.getenv("DB_PATH", "trading_council.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            risk_appetite TEXT NOT NULL,
            investment_horizon TEXT NOT NULL,
            capital_available REAL NOT NULL,
            income REAL NOT NULL,
            existing_portfolio TEXT,
            ethical_constraints TEXT,
            investment_objective TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS positions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            ticker TEXT NOT NULL,
            entry_price REAL NOT NULL,
            quantity REAL NOT NULL,
            entry_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'open',
            trigger_settings TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS persona_analyses (
            id TEXT PRIMARY KEY,
            position_id TEXT NOT NULL,
            persona_id TEXT NOT NULL,
            recommendation TEXT NOT NULL,
            reasoning TEXT,
            risk_factors TEXT,
            position_size TEXT,
            confidence REAL,
            weight REAL,
            news_links TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (position_id) REFERENCES positions(id)
        );

        CREATE TABLE IF NOT EXISTS council_verdicts (
            id TEXT PRIMARY KEY,
            position_id TEXT NOT NULL,
            action TEXT NOT NULL,
            position_size TEXT,
            summary TEXT,
            confidence REAL,
            user_followed INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (position_id) REFERENCES positions(id)
        );
    """)

    conn.commit()
    conn.close()