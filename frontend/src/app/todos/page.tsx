"use client";

import { useState, useEffect } from "react";
import { useTodos } from "@/hooks/useTodos";
import { useDebounce } from "@/hooks/useDebounce";
import { CreateTodoRequest, UpdateTodoRequest, Todo } from "@/lib/types";
import { Header } from "@/components/Header";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { TodoItem } from "@/components/todos/TodoItem";
import { CreateTodoModal } from "@/components/todos/CreateTodoModal";
import { EditTodoModal } from "@/components/todos/EditTodoModal";
import { DeleteTodoDialog } from "@/components/todos/DeleteTodoDialog";
import { Plus, Search } from "lucide-react";

const ITEMS_PER_PAGE = 20;

export default function TodosPage() {
  const [currentPage, setCurrentPage] = useState(0);
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

  // Fetch todos when filters change
  useEffect(() => {
    setCurrentPage(0);
    fetchTodos(0, ITEMS_PER_PAGE, priorityFilter, debouncedSearch.trim() ? debouncedSearch : undefined);
  }, [debouncedSearch, priorityFilter, fetchTodos]);

  const handleCreateTodo = async (data: CreateTodoRequest) => {
    try {
      setIsCreating(true);
      await createTodo(data);
      // Refetch to get updated count
      fetchTodos(0, ITEMS_PER_PAGE, priorityFilter, debouncedSearch.trim() ? debouncedSearch : undefined);
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
  const hasNextPage = currentPage < totalPages - 1;
  const hasPrevPage = currentPage > 0;

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        
        <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
          {/* Header Section */}
          <div className="flex flex-col gap-6 mb-8">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900">My Todos</h1>
              <Button
                onClick={() => setIsCreateOpen(true)}
                size="lg"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                New Todo
              </Button>
            </div>

            {/* Filters Section */}
            <div className="flex gap-4 flex-col sm:flex-row">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search todos... (min 2 chars)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  minLength={2}
                />
              </div>

              {/* Priority Filter */}
              <Select value={priorityFilter || "all"} onValueChange={(value) => setPriorityFilter(value === "all" ? undefined : value)}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="HIGH">High Priority</SelectItem>
                  <SelectItem value="MEDIUM">Medium Priority</SelectItem>
                  <SelectItem value="LOW">Low Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Todo Count */}
          {!isLoading && (
            <div className="text-sm text-gray-600 mb-4">
              Showing {todos.length} of {total} todos
            </div>
          )}

          {/* Todo List */}
          <div className="space-y-3 mb-8">
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
                />
              ))
            )}
          </div>

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                disabled={!hasPrevPage}
                onClick={() => setCurrentPage((prev) => prev - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={!hasNextPage}
                onClick={() => setCurrentPage((prev) => prev + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </main>
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
