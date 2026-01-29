/**
 * Todo API service
 * Handles all todo-related API calls
 */

import { httpClient } from "./client";
import { CreateTodoRequest, PaginatedResponse, Todo, UpdateTodoRequest } from "../types";

export class TodoService {
  /**
   * Get paginated list of todos with optional filters
   */
  async getTodos(
    page: number = 1,
    page_size: number = 20,
    priority?: string,
    search?: string
  ): Promise<PaginatedResponse<Todo>> {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("page_size", page_size.toString());
    if (priority) params.append("priority", priority);
    if (search) params.append("search", search);

    return httpClient.request<PaginatedResponse<Todo>>(
      `/todos?${params.toString()}`,
      {
        method: "GET",
      }
    );
  }

  /**
   * Get a single todo by ID
   */
  async getTodo(id: string): Promise<Todo> {
    return httpClient.request<Todo>(`/todos/${id}`, {
      method: "GET",
    });
  }

  /**
   * Create a new todo
   */
  async createTodo(data: CreateTodoRequest): Promise<Todo> {
    return httpClient.request<Todo>("/todos", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * Update an existing todo
   */
  async updateTodo(id: string, data: UpdateTodoRequest): Promise<Todo> {
    return httpClient.request<Todo>(`/todos/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  /**
   * Toggle todo completion status
   */
  async toggleComplete(id: string): Promise<Todo> {
    return httpClient.request<Todo>(`/todos/${id}/complete`, {
      method: "PATCH",
    });
  }

  /**
   * Delete a todo
   */
  async deleteTodo(id: string): Promise<void> {
    await httpClient.request<void>(`/todos/${id}`, {
      method: "DELETE",
    });
  }
}

// Singleton instance
export const todoService = new TodoService();
