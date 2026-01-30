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
  private isRefreshing: boolean = false;
  private refreshPromise: Promise<boolean> | null = null;

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
   * Automatically refreshes token on 401 errors
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

    // Handle 401 Unauthorized - attempt to refresh token
    if (response.status === 401 && endpoint !== "/auth/refresh" && endpoint !== "/auth/login") {
      const refreshed = await this.refreshAccessToken();
      
      if (refreshed) {
        // Retry the original request with the new access token
        const retryResponse = await fetch(url, {
          ...options,
          headers,
          credentials: "include",
        });
        
        if (!retryResponse.ok) {
          const error: ApiError = await retryResponse.json().catch((): ApiError => ({
            detail: `HTTP Error ${retryResponse.status}`,
          }));
          
          const errorMessage =
            typeof error.detail === "string"
              ? error.detail
              : JSON.stringify(error.detail);
          
          const err = new Error(errorMessage) as Error & { status?: number };
          err.status = retryResponse.status;
          throw err;
        }
        
        // Handle successful retry response
        if (retryResponse.status === 204 || retryResponse.headers.get("content-length") === "0") {
          return undefined as T;
        }
        
        const contentType = retryResponse.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          return retryResponse.json() as Promise<T>;
        }
        
        return undefined as T;
      } else {
        // Refresh failed, throw 401 error
        const err = new Error("Authentication required") as Error & { status?: number };
        err.status = 401;
        throw err;
      }
    }

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
   * Refresh the access token using the refresh token cookie
   * Uses a promise to prevent multiple concurrent refresh attempts
   */
  private async refreshAccessToken(): Promise<boolean> {
    // If already refreshing, wait for that to complete
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    // Start refreshing
    this.isRefreshing = true;
    this.refreshPromise = this.performRefresh();

    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  /**
   * Perform the actual token refresh
   */
  private async performRefresh(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: "POST",
        credentials: "include", // Send refresh token cookie
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        // New access token is set in cookie automatically
        return true;
      }

      // Refresh failed
      return false;
    } catch (error) {
      console.error("Token refresh failed:", error);
      return false;
    }
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
