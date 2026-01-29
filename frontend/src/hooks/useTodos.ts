import { useState, useCallback } from "react";
import { todoService } from "@/lib/api/todo.service";
import { Todo, CreateTodoRequest, UpdateTodoRequest } from "@/lib/types";
import { toast } from "sonner";

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchTodos = useCallback(
    async (page: number, page_size: number, priority?: string, search?: string) => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await todoService.getTodos(page, page_size, priority, search);
        setTodos(response.items);
        setTotal(response.total);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fetch todos";
        setError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const createTodo = useCallback(
    async (data: CreateTodoRequest) => {
      try {
        const newTodo = await todoService.createTodo(data);
        setTodos((prev) => [newTodo, ...prev]);
        toast.success("Todo created successfully!");
        return newTodo;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create todo";
        toast.error(message);
        throw err;
      }
    },
    []
  );

  const updateTodo = useCallback(
    async (id: string, data: UpdateTodoRequest) => {
      try {
        const updated = await todoService.updateTodo(id, data);
        setTodos((prev) =>
          prev.map((todo) => (todo.id === id ? updated : todo))
        );
        toast.success("Todo updated successfully!");
        return updated;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update todo";
        toast.error(message);
        throw err;
      }
    },
    []
  );

  const deleteTodo = useCallback(
    async (id: string) => {
      try {
        await todoService.deleteTodo(id);
        setTodos((prev) => prev.filter((todo) => todo.id !== id));
        setTotal((prev) => prev - 1);
        toast.success("Todo deleted successfully!");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to delete todo";
        toast.error(message);
        throw err;
      }
    },
    []
  );

  const toggleComplete = useCallback(
    async (id: string, completed: boolean) => {
      try {
        await todoService.toggleComplete(id);
        setTodos((prev) =>
          prev.map((todo) =>
            todo.id === id ? { ...todo, completed: !completed } : todo
          )
        );
        toast.success(!completed ? "Todo marked as complete!" : "Todo marked as incomplete!");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update todo";
        toast.error(message);
        throw err;
      }
    },
    []
  );

  return {
    todos,
    isLoading,
    error,
    total,
    fetchTodos,
    createTodo,
    updateTodo,
    deleteTodo,
    toggleComplete,
  };
}
