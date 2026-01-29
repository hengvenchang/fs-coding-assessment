// User types
export interface User {
  id: string;
  username: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// For backward compatibility with our old interface
export interface AuthResponse extends AuthToken {
  user?: User;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

// Todo types
export interface Todo {
  id: string;
  title: string;
  description?: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  completed: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTodoRequest {
  title: string;
  description?: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
}

export interface UpdateTodoRequest {
  title?: string;
  description?: string;
  priority?: "HIGH" | "MEDIUM" | "LOW";
  completed?: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}

// API Error
export interface ApiError {
  detail: string | { [key: string]: string[] };
}
