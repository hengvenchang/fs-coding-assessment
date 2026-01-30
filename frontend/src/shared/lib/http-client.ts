/**
 * Base HTTP client for API requests with httpOnly cookie authentication
 * 
 * Security improvements:
 * 1. No token storage in JavaScript (httpOnly cookies handled by browser)
 * 2. Automatic cookie transmission via credentials: "include"
 * 3. CSRF protection via SameSite cookie attribute
 * 4. Reduced XSS attack surface (no localStorage/sessionStorage)
 */

import { ApiError } from "../types/common.types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL must be defined in environment variables");
}

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
   * Make an HTTP request with retry logic
   * Cookies are automatically sent via credentials: "include"
   */
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    let lastError: Error | null = null;

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
        const status = (lastError as Error & { status?: number }).status;
        const isRetryableError = this.isRetryableError(lastError, status || null);
        
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
   * Cookies are automatically included via credentials: "include"
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers instanceof Headers
        ? Object.fromEntries(options.headers.entries())
        : (options.headers as Record<string, string>) || {}),
    };

    // No manual Authorization header needed - cookies are automatic!
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include", // Automatically send/receive cookies
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch((): ApiError => ({
        detail: `HTTP Error ${response.status}`,
      }));
      
      const errorMessage =
        typeof error.detail === "string"
          ? error.detail
          : JSON.stringify(error.detail);
      
      const err = new Error(errorMessage) as Error & { status?: number };
      err.status = response.status;
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
   * Clear all auth state (for logout)
   * Note: httpOnly cookies are cleared by the server logout endpoint
   */
  clearAuth(): void {
    // With httpOnly cookies, we don't store tokens client-side
    // The server's /auth/logout endpoint clears the cookie
    // This method is kept for potential client-side cleanup
    if (typeof window !== "undefined") {
      // Clear any non-httpOnly auth data if needed
      localStorage.removeItem("user_data");
    }
  }
}

// Singleton instance
export const httpClient = new HttpClient(API_URL);
