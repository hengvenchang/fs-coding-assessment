"""Todo schemas for request/response validation."""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import Field, BaseModel
from sqlmodel import SQLModel

from app.models.todo import Priority


class TodoCreateRequest(SQLModel):
    """Schema for creating a new todo."""
    title: str = Field(..., min_length=1, max_length=200, description="Todo title")
    description: str = Field(..., min_length=1, description="Todo description")
    priority: Optional[Priority] = Field(
        default=None, description="Priority level (LOW, MEDIUM, HIGH)"
    )
    due_date: Optional[datetime] = Field(default=None, description="Due date for the todo")


class TodoUpdateRequest(SQLModel):
    """Schema for updating a todo (partial updates allowed)."""
    title: Optional[str] = Field(None, min_length=1, max_length=200, description="Todo title")
    description: Optional[str] = Field(None, min_length=1, description="Todo description")
    priority: Optional[Priority] = Field(
        None, description="Priority level (LOW, MEDIUM, HIGH)"
    )
    due_date: Optional[datetime] = Field(None, description="Due date for the todo")


class TodoResponse(SQLModel):
    """Schema for todo response (all fields visible to owner)."""
    id: uuid.UUID = Field(..., description="Todo ID")
    title: str = Field(..., description="Todo title")
    description: str = Field(..., description="Todo description")
    priority: Optional[Priority] = Field(None, description="Priority level")
    due_date: Optional[datetime] = Field(None, description="Due date")
    completed: bool = Field(..., description="Whether the todo is completed")
    user_id: uuid.UUID = Field(..., description="ID of the user who owns this todo")
    created_at: datetime = Field(..., description="When the todo was created")
    updated_at: datetime = Field(..., description="When the todo was last updated")


class TodoResponsePublic(SQLModel):
    """Schema for todo response (without description for non-owners)."""
    id: uuid.UUID = Field(..., description="Todo ID")
    title: str = Field(..., description="Todo title")
    description: Optional[str] = Field(None, description="Todo description (hidden for non-owners)")
    priority: Optional[Priority] = Field(None, description="Priority level")
    due_date: Optional[datetime] = Field(None, description="Due date")
    completed: bool = Field(..., description="Whether the todo is completed")
    user_id: uuid.UUID = Field(..., description="ID of the user who owns this todo")
    created_at: datetime = Field(..., description="When the todo was created")
    updated_at: datetime = Field(..., description="When the todo was last updated")


class TodoListResponse(SQLModel):
    """Schema for paginated todo list response."""
    items: list[TodoResponsePublic] = Field(..., description="List of todos")
    total: int = Field(..., description="Total number of todos")
    page: int = Field(..., description="Current page number")
    page_size: int = Field(..., description="Number of items per page")
    total_pages: int = Field(..., description="Total number of pages")


class TodoStatsResponse(BaseModel):
    """Schema for todo statistics response."""
    total: int = Field(..., description="Total number of todos for the user")
    completed: int = Field(..., description="Number of completed todos")
    pending: int = Field(..., description="Number of pending todos")
    by_priority: dict[str, int] = Field(
        default_factory=dict, description="Count of todos by priority level"
    )
