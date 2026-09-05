import datetime
import uuid
import hashlib
import jwt
from fastapi import APIRouter, Depends, HTTPException, Header, status
from pydantic import BaseModel, EmailStr
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.database import get_db
from backend.models.user import User

router = APIRouter(prefix="/api/auth", tags=["Auth"])

SECRET_KEY = "razorshield_jwt_secret_key_2026_buildathon"
ALGORITHM = "HS256"

def hash_password(password: str) -> str:
    salt = "razorshield_salt_2026"
    return hashlib.sha256((password + salt).encode('utf-8')).hexdigest()

def create_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    confirm_password: Optional[str] = None
    organization: Optional[str] = "RazorShield Risk Ops"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

async def get_current_user(authorization: Optional[str] = Header(None), db: AsyncSession = Depends(get_db)) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication token required")
    
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except Exception:
        raise HTTPException(status_code=401, detail="Token expired or invalid")
        
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@router.post("/signup")
async def signup(req: SignupRequest, db: AsyncSession = Depends(get_db)):
    if req.confirm_password and req.password != req.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
        
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long")
        
    # Check existing user
    existing = await db.execute(select(User).where(User.email == req.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="An account with this email already exists.")
        
    user_id = f"USR-{uuid.uuid4().hex[:8].upper()}"
    new_user = User(
        id=user_id,
        name=req.name,
        email=req.email,
        password_hash=hash_password(req.password),
        organization=req.organization or "RazorShield Risk Ops",
        role="Risk Analyst",
        created_at=datetime.datetime.utcnow(),
        last_login=datetime.datetime.utcnow()
    )
    db.add(new_user)
    await db.commit()
    
    token = create_token(user_id, req.email)
    return {
        "token": token,
        "user": {
            "id": new_user.id,
            "name": new_user.name,
            "email": new_user.email,
            "organization": new_user.organization,
            "role": new_user.role,
            "created_at": new_user.created_at.isoformat() if new_user.created_at else None,
            "last_login": new_user.last_login.isoformat() if new_user.last_login else None
        }
    }

@router.post("/login")
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    hashed = hash_password(req.password)
    result = await db.execute(select(User).where(User.email == req.email, User.password_hash == hashed))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    user.last_login = datetime.datetime.utcnow()
    await db.commit()
    
    token = create_token(user.id, user.email)
    return {
        "token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "organization": user.organization,
            "role": user.role,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "last_login": user.last_login.isoformat() if user.last_login else None
        }
    }

@router.get("/me")
async def get_me(user: User = Depends(get_current_user)):
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "organization": user.organization,
        "role": user.role,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "last_login": user.last_login.isoformat() if user.last_login else None
    }

@router.post("/logout")
async def logout():
    return {"status": "logged_out"}
