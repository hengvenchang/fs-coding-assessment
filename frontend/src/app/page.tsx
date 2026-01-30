"use client";

import { useState, useEffect } from "react";
import { useTodos } from "@/features/todos";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { CreateTodoRequest, UpdateTodoRequest, Todo } from "@/features/todos";
import { Header } from "@/shared/components/Header";
import { ProtectedRoute } from "@/shared/components/ProtectedRoute";
import { useAuth } from "@/features/auth";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { useScreenReaderAnnounce } from "@/shared/components/ScreenReaderAnnouncer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TodoItem } from "@/features/todos";
import { CreateTodoModal } from "@/features/todos";
import { EditTodoModal } from "@/features/todos";
import { DeleteTodoDialog } from "@/features/todos";
import { Plus, Search } from "lucide-react";

const ITEMS_PER_PAGE = 20;

export default function Home() {
  const { user } = useAuth();
  const { announce, AnnouncerComponent } = useScreenReaderAnnounce();
  const [currentPage, setCurrentPage] = useState(1); // 1-indexed for backend
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string | undefined>();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; todoId: string; todoTitle: string }>({
    isOpen: false,
    todoId: "",
    todoTitle: "",
  });
  const [isTogglingId, setIsTogglingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 300);
  const { todos, isLoading, total, fetchTodos, createTodo, updateTodo, deleteTodo, toggleComplete } = useTodos();

  // Fetch todos when filters change - reset to page 1
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, priorityFilter]);

  // Fetch todos when page or filters change
  useEffect(() => {
    fetchTodos(currentPage, ITEMS_PER_PAGE, priorityFilter, debouncedSearch.trim() ? debouncedSearch : undefined);
  }, [currentPage, priorityFilter, debouncedSearch, fetchTodos]);

  // Announce loading status to screen readers
  useEffect(() => {
    if (isLoading) {
      announce("Loading todos", "polite");
    } else {
      announce(`Loaded ${todos.length} of ${total} todos`, "polite");
    }
  }, [isLoading, todos.length, total, announce]);

  const handleCreateTodo = async (data: CreateTodoRequest) => {
    try {
      setIsCreating(true);
      await createTodo(data);
      // Refetch to get updated count
      fetchTodos(1, ITEMS_PER_PAGE, priorityFilter, debouncedSearch.trim() ? debouncedSearch : undefined);
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditTodo = async (data: UpdateTodoRequest) => {
    if (!editingTodo) return;
    try {
      setIsEditing(true);
      await updateTodo(editingTodo.id, data);
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteTodo = async () => {
    try {
      setIsDeleting(true);
      await deleteTodo(deleteDialog.todoId);
      setDeleteDialog({ isOpen: false, todoId: "", todoTitle: "" });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleTodo = async (id: string, completed: boolean) => {
    try {
      setIsTogglingId(id);
      await toggleComplete(id, completed);
      // Refetch to update pagination and total count
      fetchTodos(currentPage, ITEMS_PER_PAGE, priorityFilter, debouncedSearch.trim() ? debouncedSearch : undefined);
    } finally {
      setIsTogglingId(null);
    }
  };

  const handleEditClick = (todo: Todo) => {
    setEditingTodo(todo);
    setIsEditOpen(true);
  };

  const handleDeleteClick = (id: string, title: string) => {
    setDeleteDialog({ isOpen: true, todoId: id, todoTitle: title });
  };

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-gray-50">
        {/* Skip to main content for keyboard users */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        
        <Header />
        
        <main id="main-content" className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 w-full" role="main" aria-label="Todo list">
          {/* Header Section */}
          <div className="flex flex-col gap-4 md:gap-6 mb-6 md:mb-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Todos</h1>
              <Button
                onClick={() => setIsCreateOpen(true)}
                size="lg"
                className="gap-2 w-full sm:w-auto"
                aria-label="Create new todo"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>New Todo</span>
              </Button>
            </div>

            {/* Filters Section */}
            <section aria-label="Filter todos" className="flex gap-4 flex-col sm:flex-row">
              {/* Search */}
              <div className="flex-1 relative">
                <label htmlFor="search-todos" className="sr-only">
                  Search todos by title or description
                </label>
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
                <Input
                  id="search-todos"
                  type="search"
                  placeholder="Search Title, Description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  minLength={2}
                  aria-describedby="search-help"
                />
                <span id="search-help" className="sr-only">
                  Type at least 2 characters to search todos
                </span>
              </div>

              {/* Priority Filter */}
              <div>
                <label htmlFor="priority-filter" className="sr-only">
                  Filter by priority
                </label>
                <Select value={priorityFilter || "all"} onValueChange={(value) => setPriorityFilter(value === "all" ? undefined : value)}>
                  <SelectTrigger id="priority-filter" className="w-full sm:w-40" aria-label="Filter todos by priority">
                    <SelectValue placeholder="All Priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </section>
          </div>

          {/* Todo Count */}
          {!isLoading && (
            <div className="text-sm text-gray-600 mb-4" role="status" aria-live="polite">
              Showing {todos.length} of {total} todos
            </div>
          )}

          {/* Todo List */}
          <section aria-label="Todo items" className="space-y-3 mb-8">
            {isLoading ? (
              // Skeleton loaders
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))
            ) : todos.length === 0 ? (
              // Empty state
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-lg bg-gray-100 mb-4">
                  <Search className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">No todos found</h3>
                <p className="text-gray-600 mt-1">
                  {searchQuery || priorityFilter
                    ? "Try adjusting your filters"
                    : "Create your first todo to get started"}
                </p>
              </div>
            ) : (
              // Todo items
              todos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={handleToggleTodo}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteClick}
                  isToggling={isTogglingId === todo.id}
                  currentUserId={user?.id}
                />
              ))
            )}
          </section>

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <nav aria-label="Todo pagination" className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <Button
                variant="outline"
                disabled={!hasPrevPage}
                onClick={() => setCurrentPage((prev) => prev - 1)}
                aria-label={`Go to previous page, page ${currentPage - 1}`}
                className="w-full sm:w-auto"
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600 order-first sm:order-none" aria-current="page" aria-live="polite">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={!hasNextPage}
                onClick={() => setCurrentPage((prev) => prev + 1)}
                aria-label={`Go to next page, page ${currentPage + 1}`}
                className="w-full sm:w-auto"
              >
                Next
              </Button>
            </nav>
          )}
        </main>
        
        {/* Screen reader announcer */}
        <AnnouncerComponent />
      </div>

      {/* Modals */}
      <CreateTodoModal
        isOpen={isCreateOpen}
        isLoading={isCreating}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateTodo}
      />

      <EditTodoModal
        todo={editingTodo}
        isOpen={isEditOpen}
        isLoading={isEditing}
        onClose={() => {
          setIsEditOpen(false);
          setEditingTodo(null);
        }}
        onSubmit={handleEditTodo}
      />

      <DeleteTodoDialog
        isOpen={deleteDialog.isOpen}
        todoTitle={deleteDialog.todoTitle}
        isLoading={isDeleting}
        onClose={() => setDeleteDialog({ isOpen: false, todoId: "", todoTitle: "" })}
        onConfirm={handleDeleteTodo}
      />
    </ProtectedRoute>
  );
}
