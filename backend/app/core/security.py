from datetime import datetime, timedelta, timezone
import secrets
import hashlib

import jwt
from pwdlib import PasswordHash

from app.core.config import get_settings

password_hash = PasswordHash.recommended()

settings = get_settings()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return password_hash.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return password_hash.hash(password)


def create_access_token(subject: str, expires_delta: timedelta, username: str = None) -> str:
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode = {"sub": str(subject), "exp": expire, "type": "access"}
    if username:
        to_encode["username"] = username
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def create_refresh_token() -> str:
    """
    Create a refresh token (opaque token, not JWT).
    Returns a secure random token that will be stored in database.
    """
    # Generate cryptographically secure random token
    token = secrets.token_urlsafe(32)  # 32 bytes = 256 bits
    return token


def hash_token(token: str) -> str:
    """
    Hash a token for secure storage in database using SHA256.
    Uses deterministic hashing so the same token always produces the same hash.
    """
    return hashlib.sha256(token.encode()).hexdigest()


def verify_token_hash(token: str, hashed_token: str) -> bool:
    """Verify a token against its SHA256 hash."""
    return hash_token(token) == hashed_token
