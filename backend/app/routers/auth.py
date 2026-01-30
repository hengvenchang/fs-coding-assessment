import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Response, status, Cookie, HTTPException
from fastapi.security import OAuth2PasswordRequestForm

from app.dependencies.user import UserServiceDep
from app.dependencies.session import SessionDep
from app.schemas.auth import AuthToken
from app.schemas.user import UserLogin, UserRead, UserRegister
from app.core.config import get_settings, get_cookie_settings
from app.core.security import create_refresh_token, hash_token
from app.repositories.refresh_token_repository import RefreshTokenRepository


router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()
cookie_settings = get_cookie_settings()
REFRESH_COOKIE_NAME = "refresh_token"


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register(
    user_in: UserRegister, 
    user_service: UserServiceDep, 
    session: SessionDep,
    response: Response
):
    """Register a new user and set authentication cookies."""
    user = await user_service.register_user(user_in)
    
    # Generate access token for the new user
    auth_token = await user_service.generate_token_for_user(user.id, user.username)
    
    # Generate and store refresh token
    refresh_token = create_refresh_token()
    token_hash = hash_token(refresh_token)
    refresh_repo = RefreshTokenRepository(session)
    await refresh_repo.create_refresh_token(user.id, token_hash)
    
    # Set access token cookie
    response.set_cookie(
        key=cookie_settings.name,
        value=auth_token.access_token,
        **cookie_settings.get_config(max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    )
    
    # Set refresh token cookie with longer expiration
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=refresh_token,
        **cookie_settings.get_config(max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60)
    )
    
    return user


@router.post("/login")
async def login(
    user_in: UserLogin, 
    user_service: UserServiceDep, 
    session: SessionDep,
    response: Response
):
    """Authenticate user and set httpOnly cookies."""
    auth_token = await user_service.authenticate_user(user_in)
    
    # Get user for refresh token
    user = await user_service.user_repository.get_user_by_username(user_in.username)
    
    # Generate and store refresh token
    refresh_token = create_refresh_token()
    token_hash = hash_token(refresh_token)
    refresh_repo = RefreshTokenRepository(session)
    await refresh_repo.create_refresh_token(user.id, token_hash)
    
    # Set access token cookie
    response.set_cookie(
        key=cookie_settings.name,
        value=auth_token.access_token,
        **cookie_settings.get_config(max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    )
    
    # Set refresh token cookie with longer expiration
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=refresh_token,
        **cookie_settings.get_config(max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60)
    )
    
    # Return success message instead of token
    return {
        "message": "Login successful",
        "expires_in": auth_token.expires_in,
    }


@router.post("/logout")
async def logout(
    session: SessionDep,
    response: Response,
    refresh_token: str | None = Cookie(None, alias=REFRESH_COOKIE_NAME),
):
    """Logout user by clearing cookies and revoking refresh token."""
    # Revoke refresh token if present
    if refresh_token:
        token_hash = hash_token(refresh_token)
        refresh_repo = RefreshTokenRepository(session)
        await refresh_repo.revoke_token(token_hash)
    
    # Clear access token cookie
    response.delete_cookie(
        key=cookie_settings.name,
        path=cookie_settings.path,
        httponly=cookie_settings.httponly,
        secure=cookie_settings.secure,
        samesite=cookie_settings.samesite,
    )
    
    # Clear refresh token cookie
    response.delete_cookie(
        key=REFRESH_COOKIE_NAME,
        path=cookie_settings.path,
        httponly=cookie_settings.httponly,
        secure=cookie_settings.secure,
        samesite=cookie_settings.samesite,
    )
    
    return {"message": "Logout successful"}


@router.post("/refresh")
async def refresh_token(
    session: SessionDep,
    user_service: UserServiceDep,
    response: Response,
    refresh_token: str | None = Cookie(None, alias=REFRESH_COOKIE_NAME),
):
    """Exchange a valid refresh token for a new access token."""
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found",
        )
    
    try:
        # Validate refresh token
        from app.core.security import hash_token
        token_hash = hash_token(refresh_token)
        
        refresh_repo = RefreshTokenRepository(session)
        stored_token = await refresh_repo.get_active_token(token_hash)
        
        if not stored_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token",
            )
        
        # Generate new access token
        user = await user_service.get_user(stored_token.user_id)
        auth_token = await user_service.generate_token_for_user(user.id, user.username)
        
        # Set new access token cookie
        response.set_cookie(
            key=cookie_settings.name,
            value=auth_token.access_token,
            **cookie_settings.get_config(max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)
        )
        
        return {
            "message": "Token refreshed successfully",
            "expires_in": auth_token.expires_in,
        }
    except HTTPException:
        raise
    except Exception as e:
        # Log the actual error for debugging
        print(f"Refresh token error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Failed to refresh token",
        )


@router.post("/oauth2")
async def login_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    user_service: UserServiceDep,
    session: SessionDep,
    response: Response,
) -> dict:
    """
    OAuth2 compatible token login with httpOnly cookies.
    Used by FastAPI's /docs Swagger UI "Authorize" button.
    """
    user_in = UserLogin(username=form_data.username, password=form_data.password)
    auth_token = await user_service.authenticate_user(user_in)
    
    # Get user for refresh token
    user = await user_service.user_repository.get_user_by_username(form_data.username)
    
    # Generate and store refresh token
    refresh_token = create_refresh_token()
    token_hash = hash_token(refresh_token)
    refresh_repo = RefreshTokenRepository(session)
    await refresh_repo.create_refresh_token(user.id, token_hash)
    
    # Set access token cookie
    response.set_cookie(
        key=cookie_settings.name,
        value=auth_token.access_token,
        **cookie_settings.get_config(max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    )
    
    # Set refresh token cookie with longer expiration
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=refresh_token,
        **cookie_settings.get_config(max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60)
    )
    
    return {
        "message": "Login successful",
        "expires_in": auth_token.expires_in,
    }
