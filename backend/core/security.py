# ============================================================
#  core/security.py  — JWT tokens, password hashing, RBAC deps
# ============================================================

import os
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY   = os.getenv("JWT_SECRET",       "supersecret-change-in-production")
ALGORITHM    = os.getenv("JWT_ALGORITHM",    "HS256")
EXPIRE_HRS   = int(os.getenv("JWT_EXPIRE_HOURS", 24))

# bcrypt context for secure password storage
pwd_context  = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Reads "Authorization: Bearer <token>" header
bearer_scheme = HTTPBearer()


# ── Password helpers ──────────────────────────────────────────

def hash_password(plain: str) -> str:
    """Hash a plain-text password with bcrypt."""
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    """Return True if plain matches the stored bcrypt hash."""
    return pwd_context.verify(plain, hashed)


# ── JWT helpers ───────────────────────────────────────────────

def create_token(data: dict) -> str:
    """Create a signed JWT token that expires after EXPIRE_HRS."""
    payload = {**data, "exp": datetime.utcnow() + timedelta(hours=EXPIRE_HRS)}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    """Decode + verify a JWT. Raises 401 if invalid/expired."""
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token — please log in again.",
        )


# ── FastAPI dependency helpers (RBAC) ─────────────────────────

from typing import Optional

def get_current_user(
    token: Optional[str] = None,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))
) -> dict:
    """
    Any authenticated user. Supports Header or Query Param (for downloads).
    """
    actual_token = None
    if credentials:
        actual_token = credentials.credentials
    elif token:
        actual_token = token
        
    if not actual_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return decode_token(actual_token)


def require_admin(user: dict = Depends(get_current_user)) -> dict:
    """Only admin role can access this endpoint."""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")
    return user


def require_mess_staff_or_admin(user: dict = Depends(get_current_user)) -> dict:
    """Mess staff or admin can access this endpoint."""
    if user.get("role") not in ("admin", "mess_staff"):
        raise HTTPException(status_code=403, detail="Mess staff or admin access required.")
    return user


def require_voter(user: dict = Depends(get_current_user)) -> dict:
    """Only voter role can submit feedback."""
    if user.get("role") != "voter":
        raise HTTPException(status_code=403, detail="Only voters can submit feedback.")
    return user
