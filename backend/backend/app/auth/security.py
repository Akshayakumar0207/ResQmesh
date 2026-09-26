"""
Auth core: password hashing (bcrypt) and JWT issuing/verification (PyJWT).

Token design:
- ACCESS token: short-lived (default 15 min), sent in the Authorization
  header on every request, never stored server-side.
- REFRESH token: longer-lived (7 days normally, 30 days with "remember me"),
  delivered as an httpOnly cookie so it isn't reachable from JS — the
  standard mitigation against XSS token theft for browser apps.
- RESET token: short-lived (30 min), single-purpose (typ=reset), emailed
  or (in demo mode) returned directly to the caller for testability.

All three are signed with the same secret but carry a "typ" claim so a
token issued for one purpose can never be replayed as another.
"""

from datetime import datetime, timedelta, timezone
from typing import Literal

import bcrypt
import jwt

from app.config import get_settings

settings = get_settings()

TokenType = Literal["access", "refresh", "reset"]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def _create_token(subject: str, typ: TokenType, expires_delta: timedelta, extra: dict | None = None) -> str:
    now = datetime.now(timezone.utc)
    payload = {"sub": subject, "typ": typ, "iat": now, "exp": now + expires_delta}
    if extra:
        payload.update(extra)
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_access_token(user_id: str, role: str) -> str:
    return _create_token(user_id, "access", timedelta(minutes=settings.access_token_expire_minutes), {"role": role})


def create_refresh_token(user_id: str, remember_me: bool = False) -> str:
    days = settings.refresh_token_remember_days if remember_me else settings.refresh_token_expire_days
    return _create_token(user_id, "refresh", timedelta(days=days))


def create_reset_token(user_id: str) -> str:
    return _create_token(user_id, "reset", timedelta(minutes=settings.reset_token_expire_minutes))


def decode_token(token: str, expected_type: TokenType) -> dict:
    """Raises jwt.PyJWTError (caught by callers) on any invalid/expired/wrong-purpose token."""
    payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    if payload.get("typ") != expected_type:
        raise jwt.InvalidTokenError(f"Expected a {expected_type} token")
    return payload
