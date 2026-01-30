"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User } from "../types/auth.types";
import { authService } from "../services/auth.service";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check authentication on mount by fetching current user
  // With httpOnly cookies, we can't check client-side
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch {
        // Not authenticated or session expired
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const login = useCallback(
    async (username: string, password: string) => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Login sets httpOnly cookie on backend
        await authService.login({ username, password });
        
        // Fetch user data now that we're authenticated
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        console.error("Login error details:", err);
        const message = err instanceof Error ? err.message : "Login failed";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Register sets httpOnly cookie and returns user data
        const newUser = await authService.register({ username, email, password });
        setUser(newUser);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Registration failed";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      // Server clears the httpOnly cookie
      await authService.logout();
      setUser(null);
      setError(null);
    } catch (err) {
      // Still clear user state even if server call fails
      setUser(null);
      const message = err instanceof Error ? err.message : "Logout failed";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
