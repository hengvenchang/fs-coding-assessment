"""Repository for todo database operations."""

import uuid
from typing import Optional
from sqlalchemy import select, func, and_, or_, case
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select as sqlmodel_select

from app.models.todo import Todo, Priority


class TodoRepository:
    """Repository for managing todo database operations."""

    def __init__(self, session: AsyncSession):
        """Initialize repository with async session.
        
        Args:
            session: AsyncSession for database operations
        """
        self.session = session

    async def create(self, todo: Todo) -> Todo:
        """Create a new todo in the database.
        
        Args:
            todo: Todo model instance to create
            
        Returns:
            Created todo with ID
        """
        self.session.add(todo)
        await self.session.flush()
        await self.session.refresh(todo)
        return todo

    async def get_by_id(self, todo_id: uuid.UUID) -> Optional[Todo]:
        """Get a todo by ID.
        
        Args:
            todo_id: UUID of the todo to retrieve
            
        Returns:
            Todo if found, None otherwise
        """
        statement = select(Todo).where(Todo.id == todo_id)
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()

    async def get_all(
        self,
        page: int = 1,
        page_size: int = 20,
        priority: Optional[Priority] = None,
        completed: Optional[bool] = None,
        search: Optional[str] = None,
    ) -> tuple[list[Todo], int]:
        """Get all todos with optional filtering and pagination.
        
        Args:
            page: Page number (1-indexed)
            page_size: Number of items per page
            priority: Filter by priority level
            completed: Filter by completion status
            search: Search in title and description
            
        Returns:
            Tuple of (todos, total_count)
        """
        # Build query with filters
        filters = []
        
        if priority is not None:
            filters.append(Todo.priority == priority)
        
        if completed is not None:
            filters.append(Todo.completed == completed)
        
        if search:
            search_term = f"%{search}%"
            filters.append(
                or_(
                    Todo.title.ilike(search_term),
                    Todo.description.ilike(search_term),
                )
            )
        
        # Count total matching records
        count_statement = select(func.count(Todo.id))
        if filters:
            count_statement = count_statement.where(and_(*filters))
        
        count_result = await self.session.execute(count_statement)
        total = count_result.scalar() or 0
        
        # Get paginated results
        statement = select(Todo)
        if filters:
            statement = statement.where(and_(*filters))
        
        # Order by created_at descending (newest first)
        statement = statement.order_by(Todo.created_at.desc())
        
        # Apply pagination
        offset = (page - 1) * page_size
        statement = statement.offset(offset).limit(page_size)
        
        result = await self.session.execute(statement)
        todos = result.scalars().all()
        
        return list(todos), total

    async def get_user_todos(
        self,
        user_id: uuid.UUID,
        page: int = 1,
        page_size: int = 20,
        priority: Optional[Priority] = None,
        completed: Optional[bool] = None,
        search: Optional[str] = None,
    ) -> tuple[list[Todo], int]:
        """Get todos for a specific user with optional filtering and pagination.
        
        Args:
            user_id: UUID of the user
            page: Page number (1-indexed)
            page_size: Number of items per page
            priority: Filter by priority level
            completed: Filter by completion status
            search: Search in title and description
            
        Returns:
            Tuple of (todos, total_count)
        """
        filters = [Todo.user_id == user_id]
        
        if priority is not None:
            filters.append(Todo.priority == priority)
        
        if completed is not None:
            filters.append(Todo.completed == completed)
        
        if search:
            search_term = f"%{search}%"
            filters.append(
                or_(
                    Todo.title.ilike(search_term),
                    Todo.description.ilike(search_term),
                )
            )
        
        # Count total matching records
        count_statement = select(func.count(Todo.id)).where(and_(*filters))
        count_result = await self.session.execute(count_statement)
        total = count_result.scalar() or 0
        
        # Get paginated results
        statement = select(Todo).where(and_(*filters))
        statement = statement.order_by(Todo.created_at.desc())
        
        offset = (page - 1) * page_size
        statement = statement.offset(offset).limit(page_size)
        
        result = await self.session.execute(statement)
        todos = result.scalars().all()
        
        return list(todos), total

    async def update(self, todo: Todo) -> Todo:
        """Update an existing todo.
        
        Args:
            todo: Todo model instance with updated values
            
        Returns:
            Updated todo
        """
        self.session.add(todo)
        await self.session.flush()
        await self.session.refresh(todo)
        return todo

    async def delete(self, todo_id: uuid.UUID) -> bool:
        """Delete a todo by ID.
        
        Args:
            todo_id: UUID of the todo to delete
            
        Returns:
            True if deleted, False if not found
        """
        todo = await self.get_by_id(todo_id)
        if not todo:
            return False
        
        await self.session.delete(todo)
        await self.session.flush()
        return True

    async def get_user_stats(self, user_id: uuid.UUID) -> dict:
        """Get statistics for a user's todos.
        
        Args:
            user_id: UUID of the user
            
        Returns:
            Dictionary with total, completed, pending, and by_priority counts
        """

        # Aggregate total and completed in one query
        total_completed_stmt = select(
            func.count(Todo.id).label("total"),
            func.count(case((Todo.completed == True, 1))).label("completed")
        ).where(Todo.user_id == user_id)

        total_completed_result = await self.session.execute(total_completed_stmt)
        row = total_completed_result.one()
        total = row.total or 0
        completed = row.completed or 0
        pending = total - completed

        # Aggregate count by priority
        priority_stmt = (
            select(Todo.priority, func.count(Todo.id))
            .where(Todo.user_id == user_id)
            .group_by(Todo.priority)
        )
        priority_result = await self.session.execute(priority_stmt)

        # Initialize all priorities to 0
        by_priority = {priority.value: 0 for priority in Priority}

        # Update counts from DB
        for priority, count in priority_result.all():
            by_priority[priority.value] = count

        return {
            "total": total,
            "completed": completed,
            "pending": pending,
            "by_priority": by_priority,
        }
