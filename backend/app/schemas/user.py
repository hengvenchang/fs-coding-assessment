import uuid

from pydantic import EmailStr
from sqlmodel import Field, SQLModel

from app.models.user import UserBase, UserStatus
from app.schemas.mixin import TimeStampMixin


class UserRegister(SQLModel):
    username: str = Field(max_length=255)
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=128)


class UserLogin(SQLModel):
    username: str = Field(max_length=255)
    password: str = Field(min_length=8, max_length=128)


class UserRead(UserBase, TimeStampMixin):
    id: uuid.UUID


class UserCreate(UserBase):
    hashed_password: str = Field(max_length=255)


class UserUpdate(SQLModel):
    email: EmailStr | None = Field(default=None, max_length=255)
    status: UserStatus | None = None
