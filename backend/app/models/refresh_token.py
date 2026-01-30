import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlmodel import Field, SQLModel, Relationship

from app.schemas.mixin import TimeStampMixin

if TYPE_CHECKING:
    from app.models.user import User


class RefreshToken(TimeStampMixin, SQLModel, table=True):
    """Refresh token model for handling long-lived authentication tokens."""
    __tablename__ = "refresh_token"
    
    id: uuid.UUID = Field(
        default_factory=uuid.uuid4, primary_key=True, index=True, nullable=False
    )
    user_id: uuid.UUID = Field(foreign_key="user.id", nullable=False, index=True)
    token_hash: str = Field(max_length=255, nullable=False, index=True, unique=True)
    expires_at: datetime = Field(nullable=False, index=True)
    revoked_at: datetime | None = Field(default=None, nullable=True)
    
    # Relationship
    user: "User" = Relationship(back_populates="refresh_tokens")
