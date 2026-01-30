/**
 * Authentication API service with httpOnly cookie support
 * 
 * Security: Cookies are automatically managed by the browser.
 * No token storage in JavaScript = reduced XSS attack surface.
 */

import { httpClient } from "@/shared/lib/http-client";
import { LoginRequest, RegisterRequest, User } from "../types/auth.types";

export class AuthService {
  /**
   * Register a new user
   * Backend sets httpOnly cookie automatically
   */
  async register(data: RegisterRequest): Promise<User> {
    return await httpClient.request<User>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
    // Cookie is set by server via Set-Cookie header
  }

  /**
   * Login user
   * Backend sets httpOnly cookie automatically
   */
  async login(data: LoginRequest): Promise<{ message: string; expires_in: number }> {
    return await httpClient.request<{ message: string; expires_in: number }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
    // Cookie is set by server via Set-Cookie header
  }

  /**
   * Get current authenticated user
   * Cookie is sent automatically with request
   */
  async getCurrentUser(): Promise<User> {
    return httpClient.request<User>("/users/me", {
      method: "GET",
    });
  }

  /**
   * Logout user - server clears the httpOnly cookie
   */
  async logout(): Promise<void> {
    await httpClient.request<void>("/auth/logout", {
      method: "POST",
    });
    // Server deletes the cookie
    httpClient.clearAuth(); // Clear any client-side data
  }

  /**
   * Check if user is authenticated by trying to fetch current user
   * With httpOnly cookies, we can't check client-side
   */
  async checkAuth(): Promise<boolean> {
    try {
      await this.getCurrentUser();
      return true;
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const authService = new AuthService();
