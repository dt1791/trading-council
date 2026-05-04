from backend.auth_service import register_user, login_user, hash_password, verify_password

def test_password_hashing():
    hashed = hash_password("mypassword")
    assert verify_password("mypassword", hashed)
    assert not verify_password("wrongpassword", hashed)

def test_register_and_login(tmp_path, monkeypatch):
    db_path = str(tmp_path / "test.db")
    monkeypatch.setenv("DB_PATH", db_path)
    import backend.database as db_module
    db_module.DB_PATH = db_path
    user = register_user("test@example.com", "password123")
    assert user["email"] == "test@example.com"
    token = login_user("test@example.com", "password123")
    assert token is not None