"""Todo router with CRUD endpoints."""

from datetime import datetime, timezone
import uuid
from typing import Any, Annotated, Optional

from fastapi import APIRouter, status, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session
from app.dependencies.auth import CurrentUserDep
from app.models.todo import Priority
from app.schemas.todo import (
    TodoCreateRequest,
    TodoUpdateRequest,
    TodoResponse,
    TodoResponsePublic,
    TodoListResponse,
    TodoStatsResponse,
)
from app.services.todo_service import TodoService


router = APIRouter(prefix="/todos", tags=["todos"])

# Type alias for dependency injection
SessionDep = Annotated[AsyncSession, Depends(get_async_session)]


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=TodoResponse,
    summary="Create a new todo",
    description="Create a new todo for the authenticated user.",
)
async def create_todo(
    todo_data: TodoCreateRequest,
    current_user: CurrentUserDep,
    session: SessionDep,
) -> TodoResponse:
    """Create a new todo.
    
    - **title**: Todo title (required, max 200 chars)
    - **description**: Todo description (required)
    - **priority**: Priority level - LOW, MEDIUM, HIGH (optional)
    - **due_date**: Due date for the todo (optional)
    
    Returns the created todo with 201 status.
    """
    service = TodoService(session)
    todo = await service.create_todo(current_user.id, todo_data)
    await session.commit()
    return todo


@router.get(
    "/stats",
    response_model=TodoStatsResponse,
    summary="Get user todo statistics",
    description="Get statistics for the authenticated user's todos.",
)
async def get_stats(
    current_user: CurrentUserDep,
    session: SessionDep,
) -> TodoStatsResponse:
    """Get statistics for the authenticated user's todos.
    
    Returns:
    - **total**: Total number of todos
    - **completed**: Number of completed todos
    - **pending**: Number of pending todos
    - **by_priority**: Count by priority level (LOW, MEDIUM, HIGH)
    
    Only counts todos belonging to the authenticated user.
    """
    service = TodoService(session)
    stats = await service.get_stats(current_user.id)
    return TodoStatsResponse(**stats)


@router.get(
    "",
    response_model=TodoListResponse,
    summary="List all todos",
    description="Get all todos from all users. Description is hidden for todos not owned by the current user.",
)
async def get_todos(
    current_user: CurrentUserDep,
    session: SessionDep,
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(
        20, ge=1, le=100, description="Number of items per page"
    ),
    priority: Optional[Priority] = Query(None, description="Filter by priority"),
    completed: Optional[bool] = Query(None, description="Filter by completion status"),
    search: Optional[str] = Query(None, description="Search in title and description"),
) -> TodoListResponse:
    """Get all todos with pagination and filtering.
    
    Query parameters:
    - **page**: Page number (default: 1)
    - **page_size**: Items per page, max 100 (default: 20)
    - **priority**: Filter by LOW, MEDIUM, HIGH (optional)
    - **completed**: Filter by true/false (optional)
    - **search**: Search term (optional)
    
    Description field is hidden for todos not owned by the current user.
    """
    service = TodoService(session)
    todos, total, total_pages = await service.get_todos(
        current_user.id,
        page=page,
        page_size=page_size,
        priority=priority,
        completed=completed,
        search=search,
    )
    
    return TodoListResponse(
        items=todos,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get(
    "/{todo_id}",
    response_model=TodoResponse,
    summary="Get a single todo",
    description="Get full details of a todo. Only the owner can access full details.",
)
async def get_todo(
    todo_id: uuid.UUID,
    current_user: CurrentUserDep,
    session: SessionDep,
) -> TodoResponse:
    """Get a single todo by ID.
    
    Only the owner can access full details. Returns 403 if trying to access someone else's todo.
    Returns 404 if todo doesn't exist.
    """
    service = TodoService(session)
    return await service.get_todo(todo_id, current_user.id)


@router.patch(
    "/{todo_id}",
    response_model=TodoResponse,
    summary="Update a todo",
    description="Update a todo. Only the owner can update. Supports partial updates.",
)
async def update_todo(
    todo_id: uuid.UUID,
    todo_data: TodoUpdateRequest,
    current_user: CurrentUserDep,
    session: SessionDep,
) -> TodoResponse:
    """Update a todo.
    
    Only the owner can update. Supports partial updates (only provide fields to update).
    
    Returns 403 if not the owner.
    Returns 404 if todo doesn't exist.
    """
    service = TodoService(session)
    todo = await service.update_todo(todo_id, current_user.id, todo_data)
    await session.commit()
    return todo


@router.delete(
    "/{todo_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a todo",
    description="Delete a todo. Only the owner can delete.",
)
async def delete_todo(
    todo_id: uuid.UUID,
    current_user: CurrentUserDep,
    session: SessionDep,
) -> None:
    """Delete a todo.
    
    Only the owner can delete. Returns 204 on success.
    
    Returns 403 if not the owner.
    Returns 404 if todo doesn't exist.
    """
    service = TodoService(session)
    await service.delete_todo(todo_id, current_user.id)
    await session.commit()


@router.patch(
    "/{todo_id}/complete",
    response_model=TodoResponse,
    summary="Toggle todo completion status",
    description="Mark a todo as complete or incomplete. Only the owner can update.",
)
async def complete_todo(
    todo_id: uuid.UUID,
    current_user: CurrentUserDep,
    session: SessionDep,
) -> TodoResponse:
    """Toggle the completed status of a todo.
    
    Only the owner can mark as complete. Toggles between completed and not completed.
    
    Returns 403 if not the owner.
    Returns 404 if todo doesn't exist.
    """
    service = TodoService(session)
    todo = await service.toggle_completed(todo_id, current_user.id)
    await session.commit()
    return todo
