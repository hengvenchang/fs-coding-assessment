"""Tests for todo endpoints."""

import uuid
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from app.db.session import get_async_session
from app.main import app
from app.models.todo import Todo, Priority
from app.models.user import User, UserStatus
from app.schemas.auth import AuthToken
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.pool import StaticPool
from sqlmodel import SQLModel, Session, select


# Test database setup
@pytest.fixture(scope="function")
async def test_db():
    """Create an in-memory test database."""
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        echo=False,
        poolclass=StaticPool,
    )
    
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    
    yield engine
    
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)
    
    await engine.dispose()


@pytest.fixture
async def async_session(test_db):
    """Create an async session for tests."""
    async with AsyncSession(test_db, expire_on_commit=False) as session:
        yield session


@pytest.fixture
def client(async_session):
    """Create a test client with overridden session dependency."""
    async def override_get_async_session():
        return async_session
    
    app.dependency_overrides[get_async_session] = override_get_async_session
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


@pytest.fixture
async def test_user(async_session):
    """Create a test user."""
    user = User(
        id=uuid.uuid4(),
        username="testuser",
        email="testuser@example.com",
        hashed_password="hashed_password_here",
        status=UserStatus.ACTIVE,
    )
    async_session.add(user)
    await async_session.commit()
    await async_session.refresh(user)
    return user


@pytest.fixture
async def test_user_2(async_session):
    """Create a second test user."""
    user = User(
        id=uuid.uuid4(),
        username="testuser2",
        email="testuser2@example.com",
        hashed_password="hashed_password_here",
        status=UserStatus.ACTIVE,
    )
    async_session.add(user)
    await async_session.commit()
    await async_session.refresh(user)
    return user


@pytest.fixture
def auth_token(test_user):
    """Create a valid JWT token for test user."""
    from app.core.security import create_access_token
    
    token = create_access_token(
        subject=str(test_user.id),
        expires_delta=timedelta(hours=24),
    )
    return token


@pytest.fixture
def auth_token_2(test_user_2):
    """Create a valid JWT token for second test user."""
    from app.core.security import create_access_token
    
    token = create_access_token(
        subject=str(test_user_2.id),
        expires_delta=timedelta(hours=24),
    )
    return token


@pytest.fixture
async def test_todo(async_session, test_user):
    """Create a test todo."""
    todo = Todo(
        id=uuid.uuid4(),
        user_id=test_user.id,
        title="Test Todo",
        description="This is a test todo",
        priority=Priority.MEDIUM,
        due_date=None,
        completed=False,
    )
    async_session.add(todo)
    await async_session.commit()
    await async_session.refresh(todo)
    return todo


class TestCreateTodo:
    """Tests for creating todos."""

    @pytest.mark.asyncio
    async def test_create_todo_success(self, client: TestClient, auth_token: str):
        """Test that an authenticated user can create a todo.
        
        Verifies:
        - Response contains correct data
        - Status code is 201
        - Todo is assigned to the current user
        """
        response = client.post(
            "/api/v1/todos",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "title": "New Todo",
                "description": "This is a new test todo",
                "priority": "HIGH",
            },
        )

        assert response.status_code == 201
        data = response.json()
        
        # Verify required fields
        assert "id" in data
        assert data["title"] == "New Todo"
        assert data["description"] == "This is a new test todo"
        assert data["priority"] == "HIGH"
        assert data["completed"] is False
        assert "user_id" in data
        assert "created_at" in data
        assert "updated_at" in data

    @pytest.mark.asyncio
    async def test_create_todo_with_due_date(self, client: TestClient, auth_token: str):
        """Test creating a todo with a due date."""
        due_date = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
        
        response = client.post(
            "/api/v1/todos",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "title": "Todo with Due Date",
                "description": "A todo with a due date",
                "due_date": due_date,
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Todo with Due Date"
        assert data["due_date"] is not None

    @pytest.mark.asyncio
    async def test_create_todo_without_priority(self, client: TestClient, auth_token: str):
        """Test creating a todo without a priority (optional field)."""
        response = client.post(
            "/api/v1/todos",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "title": "Todo without Priority",
                "description": "A todo without priority",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["priority"] is None

    @pytest.mark.asyncio
    async def test_create_todo_missing_title(self, client: TestClient, auth_token: str):
        """Test that creating a todo without title fails."""
        response = client.post(
            "/api/v1/todos",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "description": "Missing title",
            },
        )

        assert response.status_code == 422  # Validation error

    @pytest.mark.asyncio
    async def test_create_todo_missing_description(self, client: TestClient, auth_token: str):
        """Test that creating a todo without description fails."""
        response = client.post(
            "/api/v1/todos",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "title": "Missing description",
            },
        )

        assert response.status_code == 422  # Validation error

    @pytest.mark.asyncio
    async def test_create_todo_unauthorized(self, client: TestClient):
        """Test that creating a todo without authentication fails."""
        response = client.post(
            "/api/v1/todos",
            json={
                "title": "Unauthorized Todo",
                "description": "Should fail",
            },
        )

        assert response.status_code == 401  # Unauthorized (no token)


class TestGetAllTodos:
    """Tests for getting all todos."""

    @pytest.mark.asyncio
    async def test_get_all_todos(
        self, client: TestClient, auth_token: str, test_user, async_session
    ):
        """Test that an authenticated user can get all todos.
        
        Verifies:
        - Status code is 200
        - Response contains list of todos
        - Description is hidden for todos not owned by the user
        - Todos show user_id to identify owner
        """
        # Create multiple todos from different users
        user2 = User(
            id=uuid.uuid4(),
            username="otheruser",
            email="otheruser@example.com",
            hashed_password="hashed",
            status=UserStatus.ACTIVE,
        )
        async_session.add(user2)
        await async_session.commit()

        # Create todo for current user
        todo1 = Todo(
            id=uuid.uuid4(),
            user_id=test_user.id,
            title="User's Todo",
            description="This is the user's private todo",
            priority=Priority.HIGH,
            completed=False,
        )
        
        # Create todo for other user
        todo2 = Todo(
            id=uuid.uuid4(),
            user_id=user2.id,
            title="Other User's Todo",
            description="This is another user's todo",
            priority=Priority.LOW,
            completed=False,
        )
        
        async_session.add(todo1)
        async_session.add(todo2)
        await async_session.commit()

        response = client.get(
            "/api/v1/todos",
            headers={"Authorization": f"Bearer {auth_token}"},
        )

        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "items" in data
        assert "total" in data
        assert "page" in data
        assert "page_size" in data
        assert "total_pages" in data
        
        items = data["items"]
        assert len(items) >= 2
        
        # Find the user's todo and other user's todo
        user_todo = next((t for t in items if t["id"] == str(todo1.id)), None)
        other_todo = next((t for t in items if t["id"] == str(todo2.id)), None)
        
        assert user_todo is not None
        assert other_todo is not None
        
        # Verify description is visible for user's own todo
        assert user_todo["description"] == "This is the user's private todo"
        
        # Verify description is hidden (None) for other user's todo
        assert other_todo["description"] is None
        
        # Verify user_id is shown for both
        assert user_todo["user_id"] == str(test_user.id)
        assert other_todo["user_id"] == str(user2.id)

    @pytest.mark.asyncio
    async def test_get_todos_with_pagination(
        self, client: TestClient, auth_token: str, test_user, async_session
    ):
        """Test pagination for todos listing."""
        # Create 25 todos
        for i in range(25):
            todo = Todo(
                id=uuid.uuid4(),
                user_id=test_user.id,
                title=f"Todo {i}",
                description=f"Description {i}",
                completed=False,
            )
            async_session.add(todo)
        
        await async_session.commit()

        # Get first page (default page_size=20)
        response = client.get(
            "/api/v1/todos",
            headers={"Authorization": f"Bearer {auth_token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["page"] == 1
        assert len(data["items"]) == 20
        assert data["total"] == 25
        assert data["total_pages"] == 2

        # Get second page
        response = client.get(
            "/api/v1/todos?page=2",
            headers={"Authorization": f"Bearer {auth_token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["page"] == 2
        assert len(data["items"]) == 5

    @pytest.mark.asyncio
    async def test_get_todos_with_page_size(
        self, client: TestClient, auth_token: str, test_user, async_session
    ):
        """Test custom page size for todos listing."""
        # Create 15 todos
        for i in range(15):
            todo = Todo(
                id=uuid.uuid4(),
                user_id=test_user.id,
                title=f"Todo {i}",
                description=f"Description {i}",
                completed=False,
            )
            async_session.add(todo)
        
        await async_session.commit()

        response = client.get(
            "/api/v1/todos?page_size=10",
            headers={"Authorization": f"Bearer {auth_token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 10
        assert data["page_size"] == 10

    @pytest.mark.asyncio
    async def test_get_todos_filter_by_priority(
        self, client: TestClient, auth_token: str, test_user, async_session
    ):
        """Test filtering todos by priority."""
        # Create todos with different priorities
        for priority in [Priority.HIGH, Priority.MEDIUM, Priority.LOW]:
            for i in range(2):
                todo = Todo(
                    id=uuid.uuid4(),
                    user_id=test_user.id,
                    title=f"Todo {priority} {i}",
                    description=f"Description",
                    priority=priority,
                    completed=False,
                )
                async_session.add(todo)
        
        await async_session.commit()

        response = client.get(
            "/api/v1/todos?priority=HIGH",
            headers={"Authorization": f"Bearer {auth_token}"},
        )

        assert response.status_code == 200
        data = response.json()
        items = data["items"]
        
        # All items should have HIGH priority
        for item in items:
            assert item["priority"] == "HIGH"
        
        assert len(items) == 2

    @pytest.mark.asyncio
    async def test_get_todos_filter_by_completion(
        self, client: TestClient, auth_token: str, test_user, async_session
    ):
        """Test filtering todos by completion status."""
        # Create completed and pending todos
        for completed in [True, False]:
            for i in range(3):
                todo = Todo(
                    id=uuid.uuid4(),
                    user_id=test_user.id,
                    title=f"Todo {completed} {i}",
                    description=f"Description",
                    completed=completed,
                )
                async_session.add(todo)
        
        await async_session.commit()

        response = client.get(
            "/api/v1/todos?completed=true",
            headers={"Authorization": f"Bearer {auth_token}"},
        )

        assert response.status_code == 200
        data = response.json()
        items = data["items"]
        
        for item in items:
            assert item["completed"] is True
        
        assert len(items) == 3

    @pytest.mark.asyncio
    async def test_get_todos_search(
        self, client: TestClient, auth_token: str, test_user, async_session
    ):
        """Test searching todos by title."""
        # Create todos with different titles
        todos_data = [
            ("Buy groceries", "Need to buy milk and bread"),
            ("Finish project", "Complete the project"),
            ("Call mom", "Remember to call mom"),
        ]
        
        for title, desc in todos_data:
            todo = Todo(
                id=uuid.uuid4(),
                user_id=test_user.id,
                title=title,
                description=desc,
                completed=False,
            )
            async_session.add(todo)
        
        await async_session.commit()

        response = client.get(
            "/api/v1/todos?search=project",
            headers={"Authorization": f"Bearer {auth_token}"},
        )

        assert response.status_code == 200
        data = response.json()
        items = data["items"]
        
        assert len(items) == 1
        assert "project" in items[0]["title"].lower()

    @pytest.mark.asyncio
    async def test_get_todos_unauthorized(self, client: TestClient):
        """Test that getting todos without authentication fails."""
        response = client.get("/api/v1/todos")

        assert response.status_code == 401


class TestGetSingleTodo:
    """Tests for getting a single todo."""

    @pytest.mark.asyncio
    async def test_get_todo_success(
        self, client: TestClient, auth_token: str, test_user, test_todo
    ):
        """Test getting a single todo owned by the user."""
        response = client.get(
            f"/api/v1/todos/{test_todo.id}",
            headers={"Authorization": f"Bearer {auth_token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(test_todo.id)
        assert data["title"] == test_todo.title
        assert data["description"] == test_todo.description

    @pytest.mark.asyncio
    async def test_get_todo_not_found(self, client: TestClient, auth_token: str):
        """Test getting a non-existent todo."""
        fake_id = uuid.uuid4()
        response = client.get(
            f"/api/v1/todos/{fake_id}",
            headers={"Authorization": f"Bearer {auth_token}"},
        )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_get_todo_forbidden(
        self, client: TestClient, auth_token: str, test_user, test_user_2, async_session
    ):
        """Test that user cannot access another user's todo."""
        # Create todo for another user
        other_todo = Todo(
            id=uuid.uuid4(),
            user_id=test_user_2.id,
            title="Other User's Todo",
            description="Secret todo",
            completed=False,
        )
        async_session.add(other_todo)
        await async_session.commit()

        response = client.get(
            f"/api/v1/todos/{other_todo.id}",
            headers={"Authorization": f"Bearer {auth_token}"},
        )

        assert response.status_code == 403


class TestUpdateTodo:
    """Tests for updating todos."""

    @pytest.mark.asyncio
    async def test_update_todo_full(
        self, client: TestClient, auth_token: str, test_todo
    ):
        """Test fully updating a todo."""
        response = client.patch(
            f"/api/v1/todos/{test_todo.id}",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "title": "Updated Title",
                "description": "Updated description",
                "priority": "LOW",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Title"
        assert data["description"] == "Updated description"
        assert data["priority"] == "LOW"

    @pytest.mark.asyncio
    async def test_update_todo_partial(
        self, client: TestClient, auth_token: str, test_todo
    ):
        """Test partially updating a todo."""
        response = client.patch(
            f"/api/v1/todos/{test_todo.id}",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "title": "New Title Only",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "New Title Only"
        # Original description should remain
        assert data["description"] == test_todo.description

    @pytest.mark.asyncio
    async def test_update_todo_not_found(self, client: TestClient, auth_token: str):
        """Test updating a non-existent todo."""
        fake_id = uuid.uuid4()
        response = client.patch(
            f"/api/v1/todos/{fake_id}",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"title": "New Title"},
        )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_update_todo_forbidden(
        self, client: TestClient, auth_token: str, test_user_2, async_session
    ):
        """Test that user cannot update another user's todo."""
        other_todo = Todo(
            id=uuid.uuid4(),
            user_id=test_user_2.id,
            title="Other User's Todo",
            description="Secret todo",
            completed=False,
        )
        async_session.add(other_todo)
        await async_session.commit()

        response = client.patch(
            f"/api/v1/todos/{other_todo.id}",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"title": "Hacked"},
        )

        assert response.status_code == 403


class TestDeleteTodo:
    """Tests for deleting todos."""

    @pytest.mark.asyncio
    async def test_delete_todo_success(
        self, client: TestClient, auth_token: str, test_user, async_session
    ):
        """Test successfully deleting a todo."""
        todo = Todo(
            id=uuid.uuid4(),
            user_id=test_user.id,
            title="To Delete",
            description="Will be deleted",
            completed=False,
        )
        async_session.add(todo)
        await async_session.commit()

        response = client.delete(
            f"/api/v1/todos/{todo.id}",
            headers={"Authorization": f"Bearer {auth_token}"},
        )

        assert response.status_code == 204

    @pytest.mark.asyncio
    async def test_delete_todo_not_found(self, client: TestClient, auth_token: str):
        """Test deleting a non-existent todo."""
        fake_id = uuid.uuid4()
        response = client.delete(
            f"/api/v1/todos/{fake_id}",
            headers={"Authorization": f"Bearer {auth_token}"},
        )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_todo_forbidden(
        self, client: TestClient, auth_token: str, test_user_2, async_session
    ):
        """Test that user cannot delete another user's todo."""
        other_todo = Todo(
            id=uuid.uuid4(),
            user_id=test_user_2.id,
            title="Other User's Todo",
            description="Should not be deletable",
            completed=False,
        )
        async_session.add(other_todo)
        await async_session.commit()

        response = client.delete(
            f"/api/v1/todos/{other_todo.id}",
            headers={"Authorization": f"Bearer {auth_token}"},
        )

        assert response.status_code == 403


class TestCompleteTodo:
    """Tests for marking todos as complete."""

    @pytest.mark.asyncio
    async def test_toggle_todo_complete(
        self, client: TestClient, auth_token: str, test_todo
    ):
        """Test toggling todo completion status."""
        assert test_todo.completed is False

        response = client.patch(
            f"/api/v1/todos/{test_todo.id}/complete",
            headers={"Authorization": f"Bearer {auth_token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["completed"] is True

        # Toggle again
        response = client.patch(
            f"/api/v1/todos/{test_todo.id}/complete",
            headers={"Authorization": f"Bearer {auth_token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["completed"] is False

    @pytest.mark.asyncio
    async def test_toggle_todo_not_found(self, client: TestClient, auth_token: str):
        """Test toggling a non-existent todo."""
        fake_id = uuid.uuid4()
        response = client.patch(
            f"/api/v1/todos/{fake_id}/complete",
            headers={"Authorization": f"Bearer {auth_token}"},
        )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_toggle_todo_forbidden(
        self, client: TestClient, auth_token: str, test_user_2, async_session
    ):
        """Test that user cannot toggle another user's todo."""
        other_todo = Todo(
            id=uuid.uuid4(),
            user_id=test_user_2.id,
            title="Other User's Todo",
            description="Should not be toggleable",
            completed=False,
        )
        async_session.add(other_todo)
        await async_session.commit()

        response = client.patch(
            f"/api/v1/todos/{other_todo.id}/complete",
            headers={"Authorization": f"Bearer {auth_token}"},
        )

        assert response.status_code == 403


class TestTodoStats:
    """Tests for todo statistics endpoint."""

    @pytest.mark.asyncio
    async def test_get_stats_success(
        self, client: TestClient, auth_token: str, test_user, async_session
    ):
        """Test getting statistics for user's todos."""
        # Create various todos
        todos_data = [
            (Priority.HIGH, True),
            (Priority.HIGH, False),
            (Priority.MEDIUM, False),
            (Priority.MEDIUM, False),
            (Priority.LOW, True),
        ]
        
        for priority, completed in todos_data:
            todo = Todo(
                id=uuid.uuid4(),
                user_id=test_user.id,
                title=f"Todo {priority} {completed}",
                description="Test",
                priority=priority,
                completed=completed,
            )
            async_session.add(todo)
        
        await async_session.commit()

        response = client.get(
            "/api/v1/todos/stats",
            headers={"Authorization": f"Bearer {auth_token}"},
        )

        assert response.status_code == 200
        data = response.json()
        
        assert data["total"] == 5
        assert data["completed"] == 2
        assert data["pending"] == 3
        assert data["by_priority"]["HIGH"] == 2
        assert data["by_priority"]["MEDIUM"] == 2
        assert data["by_priority"]["LOW"] == 1

    @pytest.mark.asyncio
    async def test_get_stats_empty(
        self, client: TestClient, auth_token: str
    ):
        """Test getting statistics when user has no todos."""
        response = client.get(
            "/api/v1/todos/stats",
            headers={"Authorization": f"Bearer {auth_token}"},
        )

        assert response.status_code == 200
        data = response.json()
        
        assert data["total"] == 0
        assert data["completed"] == 0
        assert data["pending"] == 0
        # by_priority will contain all priority types with 0 count
        assert all(count == 0 for count in data["by_priority"].values())

    @pytest.mark.asyncio
    async def test_get_stats_only_user_todos(
        self, client: TestClient, auth_token: str, test_user, test_user_2, async_session
    ):
        """Test that stats only include current user's todos."""
        # Create todos for current user
        for i in range(3):
            todo = Todo(
                id=uuid.uuid4(),
                user_id=test_user.id,
                title=f"User Todo {i}",
                description="Test",
                priority=Priority.HIGH,
                completed=False,
            )
            async_session.add(todo)
        
        # Create todos for other user
        for i in range(5):
            todo = Todo(
                id=uuid.uuid4(),
                user_id=test_user_2.id,
                title=f"Other User Todo {i}",
                description="Test",
                priority=Priority.LOW,
                completed=True,
            )
            async_session.add(todo)
        
        await async_session.commit()

        response = client.get(
            "/api/v1/todos/stats",
            headers={"Authorization": f"Bearer {auth_token}"},
        )

        assert response.status_code == 200
        data = response.json()
        
        # Should only count user's 3 todos
        assert data["total"] == 3
        assert data["completed"] == 0
        assert data["pending"] == 3
        assert data["by_priority"]["HIGH"] == 3

    @pytest.mark.asyncio
    async def test_get_stats_unauthorized(self, client: TestClient):
        """Test that getting stats without authentication fails."""
        response = client.get("/api/v1/todos/stats")

        assert response.status_code == 401
