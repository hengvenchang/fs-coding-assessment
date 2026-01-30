/**
 * Authentication API service
 * Handles all auth-related API calls
 */

import { httpClient } from "@/shared/lib/http-client";
import { AuthResponse, AuthToken, LoginRequest, RegisterRequest, User } from "../types/auth.types";

export class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await httpClient.request<AuthToken>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
    httpClient.setToken(response.access_token);
    return response;
  }

  /**
   * Login user
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await httpClient.request<AuthToken>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
    httpClient.setToken(response.access_token);
    return response;
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User> {
    return httpClient.request<User>("/users/me", {
      method: "GET",
    });
  }

  /**
   * Logout user (clear token)
   */
  async logout(): Promise<void> {
    httpClient.clearToken();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return httpClient.getToken() !== null;
  }
}

// Singleton instance
export const authService = new AuthService();
