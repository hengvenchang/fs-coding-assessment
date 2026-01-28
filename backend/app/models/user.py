import uuid
from enum import Enum
from typing import TYPE_CHECKING

from pydantic import EmailStr
from sqlmodel import Field, SQLModel, Relationship


from app.schemas.mixin import TimeStampMixin

if TYPE_CHECKING:
    from app.models.todo import Todo


class UserStatus(str, Enum):
    """User account status."""
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    SUSPENDED = "SUSPENDED"


class UserBase(SQLModel):
    """Base user schema with common fields."""
    email: EmailStr | None = Field(
        default=None, max_length=255, unique=True, index=True, nullable=True
    )
    username: str = Field(max_length=64, unique=True, index=True, nullable=False)
    status: UserStatus = Field(default=UserStatus.ACTIVE, nullable=False)


class User(UserBase, TimeStampMixin, table=True):
    """User model with database table."""
    __tablename__ = "user"
    
    id: uuid.UUID = Field(
        default_factory=uuid.uuid4, primary_key=True, index=True, nullable=False
    )
    hashed_password: str = Field(max_length=255, nullable=False)
    
    # Relationship
    todos: list["Todo"] = Relationship(back_populates="user")
