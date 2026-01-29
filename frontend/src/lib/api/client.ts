/**
 * Base HTTP client for API requests
 * Handles authentication, headers, and error responses
 */

import { ApiError } from "../types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export class HttpClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_URL || "") {
    this.baseUrl = baseUrl;
  }

  /**
   * Make an HTTP request
   */
  async request<T>(
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

    // Handle empty responses (204 No Content, DELETE requests, etc.)
    if (response.status === 204 || response.headers.get("content-length") === "0") {
      return undefined as T;
    }

    // Check if response has content
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return response.json() as Promise<T>;
    }

    // Return undefined for non-JSON responses
    return undefined as T;
  }

  /**
   * Get authentication token from storage
   */
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem("auth_token");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  /**
   * Save authentication token to storage
   */
  setToken(token: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", JSON.stringify(token));
    }
  }

  /**
   * Remove authentication token from storage
   */
  clearToken(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
    }
  }
}

// Singleton instance
export const httpClient = new HttpClient(API_URL);
