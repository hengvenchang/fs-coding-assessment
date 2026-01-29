import { ApiError, AuthResponse, AuthToken, CreateTodoRequest, LoginRequest, PaginatedResponse, RegisterRequest, Todo, UpdateTodoRequest, User } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_URL || "") {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getToken();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers instanceof Headers
        ? Object.fromEntries(options.headers.entries())
        : (options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        detail: `HTTP Error ${response.status}`,
      }));
      throw new Error(
        typeof error.detail === "string"
          ? error.detail
          : JSON.stringify(error.detail)
      );
    }

    return response.json() as Promise<T>;
  }

  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem("auth_token");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  private setToken(token: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", JSON.stringify(token));
    }
  }

  private clearToken(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
    }
  }

  // Auth endpoints
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.request<AuthToken>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
    this.setToken(response.access_token);
    return response;
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.request<AuthToken>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
    this.setToken(response.access_token);
    return response;
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>("/users/me", {
      method: "GET",
    });
  }

  async logout(): Promise<void> {
    this.clearToken();
  }

  // Todo endpoints
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

    return this.request<PaginatedResponse<Todo>>(
      `/todos?${params.toString()}`,
      {
        method: "GET",
      }
    );
  }

  async getTodo(id: string): Promise<Todo> {
    return this.request<Todo>(`/todos/${id}`, {
      method: "GET",
    });
  }

  async createTodo(data: CreateTodoRequest): Promise<Todo> {
    return this.request<Todo>("/todos", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateTodo(id: string, data: UpdateTodoRequest): Promise<Todo> {
    return this.request<Todo>(`/todos/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteTodo(id: string): Promise<void> {
    await this.request<void>(`/todos/${id}`, {
      method: "DELETE",
    });
  }
}

export const apiClient = new ApiClient(API_URL);
