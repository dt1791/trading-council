from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.auth_service import register_user, login_user

router = APIRouter(prefix="/auth", tags=["auth"])

class RegisterRequest(BaseModel):
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/register", status_code=201)
def register(req: RegisterRequest):
    try:
        user = register_user(req.email, req.password)
        return user
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login")
def login(req: LoginRequest):
    try:
        token = login_user(req.email, req.password)
        return {"token": token}
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))