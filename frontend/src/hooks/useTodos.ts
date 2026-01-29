import { useState, useCallback } from "react";
import { todoService } from "@/lib/api/todo.service";
import { Todo, CreateTodoRequest, UpdateTodoRequest } from "@/lib/types";
import { useProgress } from "@/contexts/progress";
import { toast } from "sonner";

export function useTodos() {
  const { startLoading, stopLoading } = useProgress();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchTodos = useCallback(
    async (page: number, page_size: number, priority?: string, search?: string) => {
      try {
        startLoading();
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
        stopLoading();
        setIsLoading(false);
      }
    },
    [startLoading, stopLoading]
  );

  const createTodo = useCallback(
    async (data: CreateTodoRequest) => {
      try {
        startLoading();
        const newTodo = await todoService.createTodo(data);
        setTodos((prev) => [newTodo, ...prev]);
        setTotal((prev) => prev + 1);
        toast.success("Todo created successfully!");
        return newTodo;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create todo";
        toast.error(message);
        throw err;
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading]
  );

  const updateTodo = useCallback(
    async (id: string, data: UpdateTodoRequest) => {
      // Store previous state for rollback
      const previousTodos = todos;

      try {
        startLoading();
        // Optimistic update
        const optimisticTodo = todos.find((t) => t.id === id);
        if (optimisticTodo) {
          setTodos((prev) =>
            prev.map((todo) =>
              todo.id === id ? { ...todo, ...data } : todo
            )
          );
        }

        // API call
        const updated = await todoService.updateTodo(id, data);
        setTodos((prev) =>
          prev.map((todo) => (todo.id === id ? updated : todo))
        );
        toast.success("Todo updated successfully!");
        return updated;
      } catch (err) {
        // Rollback on error
        setTodos(previousTodos);
        const message = err instanceof Error ? err.message : "Failed to update todo";
        toast.error(message);
        throw err;
      } finally {
        stopLoading();
      }
    },
    [todos, startLoading, stopLoading]
  );

  const deleteTodo = useCallback(
    async (id: string) => {
      // Store previous state for rollback
      const previousTodos = todos;
      const previousTotal = total;

      try {
        startLoading();
        // Optimistic delete
        setTodos((prev) => prev.filter((todo) => todo.id !== id));
        setTotal((prev) => prev - 1);

        // API call
        await todoService.deleteTodo(id);
        toast.success("Todo deleted successfully!");
      } catch (err) {
        // Rollback on error
        setTodos(previousTodos);
        setTotal(previousTotal);
        const message = err instanceof Error ? err.message : "Failed to delete todo";
        toast.error(message);
        throw err;
      } finally {
        stopLoading();
      }
    },
    [todos, total, startLoading, stopLoading]
  );

  const toggleComplete = useCallback(
    async (id: string, completed: boolean) => {
      // Store previous state for rollback
      const previousTodos = todos;

      try {
        startLoading();
        // Optimistic update
        setTodos((prev) =>
          prev.map((todo) =>
            todo.id === id ? { ...todo, completed: !completed } : todo
          )
        );

        // API call
        await todoService.toggleComplete(id);
        toast.success(!completed ? "Todo marked as complete!" : "Todo marked as incomplete!");
      } catch (err) {
        // Rollback on error
        setTodos(previousTodos);
        const message = err instanceof Error ? err.message : "Failed to update todo";
        toast.error(message);
        throw err;
      } finally {
        stopLoading();
      }
    },
    [todos, startLoading, stopLoading]
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
