import uuid
import os
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
from backend.database import get_db, init_db

SECRET_KEY = os.getenv("JWT_SECRET", "trading-council-secret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": user_id, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> str:
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    return payload.get("sub")

def register_user(email: str, password: str) -> dict:
    init_db()
    conn = get_db()
    user_id = str(uuid.uuid4())
    conn.execute(
        "INSERT INTO users (id, email, password_hash, risk_appetite, investment_horizon, capital_available, income, investment_objective) VALUES (?, ?, ?, '', '', 0, 0, '')",
        (user_id, email, hash_password(password))
    )
    conn.commit()
    conn.close()
    return {"id": user_id, "email": email}

def login_user(email: str, password: str) -> str:
    conn = get_db()
    row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    conn.close()
    if not row or not verify_password(password, row["password_hash"]):
        raise ValueError("Invalid email or password")
    return create_token(row["id"])