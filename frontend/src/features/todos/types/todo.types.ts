/**
 * Todo-related TypeScript types and interfaces
 */

export interface Todo {
  id: string;
  title: string;
  description?: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  completed: boolean;
  due_date?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTodoRequest {
  title: string;
  description?: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  due_date?: string;
}

export interface UpdateTodoRequest {
  title?: string;
  description?: string;
  priority?: "HIGH" | "MEDIUM" | "LOW";
  completed?: boolean;
  due_date?: string;
}
