/**
 * Base HTTP client for API requests
 * Handles authentication, headers, error responses, and retry logic
 */

import { ApiError } from "../types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // in milliseconds
  maxDelay: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
};

export class HttpClient {
  private baseUrl: string;
  private retryConfig: RetryConfig;

  constructor(baseUrl: string = API_URL || "", retryConfig?: Partial<RetryConfig>) {
    this.baseUrl = baseUrl;
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateDelay(attempt: number): number {
    const delay = this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1);
    return Math.min(delay, this.retryConfig.maxDelay);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Check if error is retryable (not a client error)
   */
  private isRetryable(status: number): boolean {
    // Don't retry on client errors
    const nonRetryableStatuses = [400, 401, 403, 404, 422]; // 422 is validation error
    return !nonRetryableStatuses.includes(status);
  }

  /**
   * Make an HTTP request with retry logic
   */
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    let lastError: Error | null = null;
    let lastStatus: number | null = null;

    for (let attempt = 1; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await this.makeRequest<T>(endpoint, options);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // If this is the last attempt, throw the error
        if (attempt === this.retryConfig.maxRetries) {
          throw lastError;
        }

        // Check if error is retryable
        // Parse status from error message or fetch response
        const isRetryableError = this.isRetryableError(lastError, lastStatus);
        if (!isRetryableError) {
          throw lastError;
        }

        // Wait before retrying with exponential backoff
        const delay = this.calculateDelay(attempt);
        await this.sleep(delay);
      }
    }

    throw lastError || new Error("Request failed");
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: Error, status: number | null): boolean {
    // Network errors are retryable
    if (error.message.includes("fetch") || error.message.includes("network")) {
      return true;
    }

    // Server errors (5xx) are retryable
    if (status && status >= 500) {
      return true;
    }

    // Timeout-like errors
    if (error.message.includes("timeout") || error.message.includes("timeout")) {
      return true;
    }

    return false;
  }

  /**
   * Make the actual HTTP request
   */
  private async makeRequest<T>(
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
      
      const errorMessage =
        typeof error.detail === "string"
          ? error.detail
          : JSON.stringify(error.detail);
      
      const err = new Error(errorMessage);
      (err as any).status = response.status;
      throw err;
    }

    // Handle empty responses (204 No Content, DELETE requests, etc.)
    if (response.status === 204 || response.headers.get("content-length") === "0") {
      return undefined as T;
    }

    // Check if response has content
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
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
