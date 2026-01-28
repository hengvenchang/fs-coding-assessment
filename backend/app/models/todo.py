import uuid
from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING

from sqlmodel import Field, SQLModel, Relationship

from app.schemas.mixin import TimeStampMixin

if TYPE_CHECKING:
    from app.models.user import User


class Priority(str, Enum):
    """Priority levels for todos."""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class TodoStatus(str, Enum):
    """Status of a todo item."""
    NOT_STARTED = "NOT_STARTED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"


class TodoBase(SQLModel):
    """Base todo schema with common fields."""
    title: str = Field(max_length=200, nullable=False)
    description: str = Field(nullable=False)
    status: TodoStatus = Field(default=TodoStatus.NOT_STARTED, nullable=False)
    priority: Priority | None = Field(default=None, nullable=True)
    due_date: datetime | None = Field(default=None, nullable=True)


class Todo(TodoBase, TimeStampMixin, table=True):
    """Todo model with database table."""
    __tablename__ = "todo"
    
    id: uuid.UUID = Field(
        default_factory=uuid.uuid4, primary_key=True, index=True, nullable=False
    )
    user_id: uuid.UUID = Field(
        foreign_key="user.id", index=True, nullable=False
    )
    completed: bool = Field(default=False, nullable=False)
    
    # Relationship
    user: "User" = Relationship(back_populates="todos")
