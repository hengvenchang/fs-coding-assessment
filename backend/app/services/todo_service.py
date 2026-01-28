"""Service layer for todo business logic."""

import uuid
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.todo import Todo, Priority
from app.repositories.todo_repository import TodoRepository
from app.schemas.todo import TodoCreateRequest, TodoUpdateRequest, TodoResponsePublic, TodoResponse


class TodoService:
    """Service for managing todo business logic."""

    def __init__(self, session: AsyncSession):
        """Initialize service with async session.
        
        Args:
            session: AsyncSession for database operations
        """
        self.repository = TodoRepository(session)

    async def create_todo(self, user_id: uuid.UUID, data: TodoCreateRequest) -> TodoResponse:
        """Create a new todo for the user.
        
        Args:
            user_id: UUID of the user creating the todo
            data: Todo creation request data
            
        Returns:
            Created todo response
            
        Raises:
            HTTPException: If validation fails
        """
        todo = Todo(
            user_id=user_id,
            title=data.title,
            description=data.description,
            priority=data.priority,
            due_date=data.due_date,
            completed=False,
        )
        
        created_todo = await self.repository.create(todo)
        return TodoResponse.model_validate(created_todo)

    async def get_todos(
        self,
        current_user_id: uuid.UUID,
        page: int = 1,
        page_size: int = 20,
        priority: Optional[Priority] = None,
        completed: Optional[bool] = None,
        search: Optional[str] = None,
    ) -> tuple[list[TodoResponsePublic], int, int]:
        """Get all todos with pagination and filtering.
        
        Hides description for todos not owned by current user.
        
        Args:
            current_user_id: UUID of the current user
            page: Page number (1-indexed)
            page_size: Number of items per page
            priority: Filter by priority level
            completed: Filter by completion status
            search: Search in title and description
            
        Returns:
            Tuple of (todos, total_count, total_pages)
            
        Raises:
            HTTPException: If page is invalid
        """
        if page < 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Page must be >= 1",
            )
        
        if page_size < 1 or page_size > 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Page size must be between 1 and 100",
            )
        
        todos, total = await self.repository.get_all(
            page=page,
            page_size=page_size,
            priority=priority,
            completed=completed,
            search=search,
        )
        
        # Convert to public response, hiding description for non-owners
        response_todos = []
        for todo in todos:
            todo_dict = TodoResponsePublic.model_validate(todo).model_dump()
            # Hide description if user is not the owner
            if todo.user_id != current_user_id:
                todo_dict["description"] = None
            response_todos.append(TodoResponsePublic(**todo_dict))
        
        total_pages = (total + page_size - 1) // page_size
        
        return response_todos, total, total_pages

    async def get_todo(
        self, todo_id: uuid.UUID, current_user_id: uuid.UUID
    ) -> TodoResponse:
        """Get a single todo.
        
        Only the owner can see full details.
        
        Args:
            todo_id: UUID of the todo to retrieve
            current_user_id: UUID of the current user
            
        Returns:
            Todo response
            
        Raises:
            HTTPException: If todo not found or user not authorized
        """
        todo = await self.repository.get_by_id(todo_id)
        
        if not todo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Todo not found",
            )
        
        if todo.user_id != current_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this todo",
            )
        
        return TodoResponse.model_validate(todo)

    async def update_todo(
        self,
        todo_id: uuid.UUID,
        current_user_id: uuid.UUID,
        data: TodoUpdateRequest,
    ) -> TodoResponse:
        """Update a todo.
        
        Only the owner can update. Supports partial updates.
        
        Args:
            todo_id: UUID of the todo to update
            current_user_id: UUID of the current user
            data: Update request data
            
        Returns:
            Updated todo response
            
        Raises:
            HTTPException: If todo not found or user not authorized
        """
        todo = await self.repository.get_by_id(todo_id)
        
        if not todo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Todo not found",
            )
        
        if todo.user_id != current_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this todo",
            )
        
        # Update only provided fields (partial update)
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(todo, field, value)
        
        updated_todo = await self.repository.update(todo)
        return TodoResponse.model_validate(updated_todo)

    async def delete_todo(
        self, todo_id: uuid.UUID, current_user_id: uuid.UUID
    ) -> None:
        """Delete a todo.
        
        Only the owner can delete.
        
        Args:
            todo_id: UUID of the todo to delete
            current_user_id: UUID of the current user
            
        Raises:
            HTTPException: If todo not found or user not authorized
        """
        todo = await self.repository.get_by_id(todo_id)
        
        if not todo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Todo not found",
            )
        
        if todo.user_id != current_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this todo",
            )
        
        await self.repository.delete(todo_id)

    async def toggle_completed(
        self, todo_id: uuid.UUID, current_user_id: uuid.UUID
    ) -> TodoResponse:
        """Toggle the completed status of a todo.
        
        Only the owner can mark as complete.
        
        Args:
            todo_id: UUID of the todo to toggle
            current_user_id: UUID of the current user
            
        Returns:
            Updated todo response
            
        Raises:
            HTTPException: If todo not found or user not authorized
        """
        todo = await self.repository.get_by_id(todo_id)
        
        if not todo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Todo not found",
            )
        
        if todo.user_id != current_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this todo",
            )
        
        todo.completed = not todo.completed
        updated_todo = await self.repository.update(todo)
        return TodoResponse.model_validate(updated_todo)

    async def get_stats(self, user_id: uuid.UUID) -> dict:
        """Get statistics for the user's todos.
        
        Args:
            user_id: UUID of the user
            
        Returns:
            Dictionary with statistics
        """
        return await self.repository.get_user_stats(user_id)
