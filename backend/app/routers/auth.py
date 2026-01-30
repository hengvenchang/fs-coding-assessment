import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Response, status
from fastapi.security import OAuth2PasswordRequestForm

from app.dependencies.user import UserServiceDep
from app.schemas.auth import AuthToken
from app.schemas.user import UserLogin, UserRead, UserRegister
from app.core.config import get_settings, get_cookie_settings


router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()
cookie_settings = get_cookie_settings()


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserRegister, user_service: UserServiceDep, response: Response):
    """Register a new user and set authentication cookie."""
    user = await user_service.register_user(user_in)
    
    # Generate token for the new user
    auth_token = await user_service.generate_token_for_user(user.id, user.username)
    
    # Set httpOnly cookie
    response.set_cookie(
        key=cookie_settings.name,
        value=auth_token.access_token,
        **cookie_settings.get_config(max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    )
    
    return user


@router.post("/login")
async def login(user_in: UserLogin, user_service: UserServiceDep, response: Response):
    """Authenticate user and set httpOnly cookie."""
    auth_token = await user_service.authenticate_user(user_in)
    
    # Set httpOnly cookie instead of returning in response body
    response.set_cookie(
        key=cookie_settings.name,
        value=auth_token.access_token,
        **cookie_settings.get_config(max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    )
    
    # Return success message instead of token
    return {
        "message": "Login successful",
        "expires_in": auth_token.expires_in,
    }


@router.post("/logout")
async def logout(response: Response):
    """Logout user by clearing the authentication cookie."""
    response.delete_cookie(
        key=cookie_settings.name,
        path=cookie_settings.path,
        httponly=cookie_settings.httponly,
        secure=cookie_settings.secure,
        samesite=cookie_settings.samesite,
    )
    return {"message": "Logout successful"}


@router.post("/oauth2")
async def login_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    user_service: UserServiceDep,
    response: Response,
) -> dict:
    """
    OAuth2 compatible token login with httpOnly cookie.
    Used by FastAPI's /docs Swagger UI "Authorize" button.
    """
    user_in = UserLogin(username=form_data.username, password=form_data.password)
    auth_token = await user_service.authenticate_user(user_in)
    
    # Set httpOnly cookie
    response.set_cookie(
        key=cookie_settings.name,
        value=auth_token.access_token,
        **cookie_settings.get_config(max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    )
    
    return {
        "message": "Login successful",
        "expires_in": auth_token.expires_in,
    }
