from fastapi.testclient import TestClient
from backend.main import app
import os
os.environ["DB_PATH"] = "test_routes.db"

client = TestClient(app)

import os
import sqlite3

def setup_module():
    if os.path.exists("test_routes.db"):
        os.remove("test_routes.db")

def test_register_endpoint():
    response = client.post("/auth/register", json={
        "email": "routetest@example.com",
        "password": "password123"
    })
    assert response.status_code == 201
    assert "id" in response.json()

def test_login_endpoint():
    client.post("/auth/register", json={
        "email": "logintest@example.com",
        "password": "password123"
    })
    response = client.post("/auth/login", json={
        "email": "logintest@example.com",
        "password": "password123"
    })
    assert response.status_code == 200
    assert "token" in response.json()