import uuid
from typing import Annotated

import jwt
from fastapi import Cookie, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import InvalidTokenError
from pydantic import ValidationError

from app.core.config import get_settings
from app.dependencies.user import UserServiceDep
from app.models.user import User, UserStatus
from app.schemas.auth import TokenPayload


# OAuth2 scheme for Swagger UI /docs (reads from Authorization header)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/oauth2", auto_error=False)

settings = get_settings()


def get_token_from_cookie_or_header(
    access_token: str | None = Cookie(default=None),
    authorization: str | None = Depends(oauth2_scheme),
) -> str:
    """
    Extract token from httpOnly cookie (priority) or Authorization header (fallback).
    Supports both cookie-based auth and header-based auth for Swagger UI.
    """
    if access_token:
        return access_token
    
    if authorization:
        return authorization
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )


TokenDep = Annotated[str, Depends(get_token_from_cookie_or_header)]


async def get_current_user(token: TokenDep, user_service: UserServiceDep) -> User:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
        print(token_data)
    except (InvalidTokenError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    user = await user_service.get_user(uuid.UUID(token_data.sub))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    if not user.status == UserStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{user.status.value.capitalize()} user",
        )
    return user


CurrentUserDep = Annotated[User, Depends(get_current_user)]
