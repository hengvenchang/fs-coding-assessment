"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User, AuthResponse } from "@/lib/types";
import { authService } from "@/lib/api/auth.service";
import { getUserIdFromToken, getUsernameFromToken, isTokenExpired } from "@/lib/jwt";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    if (storedToken) {
      try {
        const parsedToken = JSON.parse(storedToken);
        
        // Check if token is expired
        if (!isTokenExpired(parsedToken)) {
          const userId = getUserIdFromToken(parsedToken);
          const username = getUsernameFromToken(parsedToken);
          if (userId && username) {
            setToken(parsedToken);
            // Create user object from token with username
            setUser({ id: userId, username });
          }
        } else {
          // Token is expired, clear it
          localStorage.removeItem("auth_token");
        }
      } catch {
        localStorage.removeItem("auth_token");
      }
    }
    setIsLoading(false);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const login = useCallback(
    async (username: string, password: string) => {
      // Store previous state for rollback
      const previousUser = user;
      const previousToken = token;

      try {
        setIsLoading(true);
        setError(null);
        const response: AuthResponse = await authService.login({ username, password });
        
        const newToken = response.access_token;
        setToken(newToken);
        
        // Extract user info from token
        const userId = getUserIdFromToken(newToken);
        const tokenUsername = getUsernameFromToken(newToken);
        if (userId && tokenUsername) {
          setUser({ id: userId, username: tokenUsername });
        }
      } catch (err) {
        // Rollback on error
        setUser(previousUser);
        setToken(previousToken);
        const message = err instanceof Error ? err.message : "Login failed";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [user, token]
  );

  const register = useCallback(
    async (username: string, password: string) => {
      // Store previous state for rollback
      const previousUser = user;
      const previousToken = token;

      try {
        setIsLoading(true);
        setError(null);
        const response: AuthResponse = await authService.register({ username, password });
        
        const newToken = response.access_token;
        setToken(newToken);
        
        // Extract user info from token
        const userId = getUserIdFromToken(newToken);
        const tokenUsername = getUsernameFromToken(newToken);
        if (userId && tokenUsername) {
          setUser({ id: userId, username: tokenUsername });
        }
      } catch (err) {
        // Rollback on error
        setUser(previousUser);
        setToken(previousToken);
        const message = err instanceof Error ? err.message : "Registration failed";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [user, token]
  );

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      await authService.logout();
      setUser(null);
      setToken(null);
      setError(null);
    } catch (err) {
      // Still clear auth state even if logout fails
      setUser(null);
      setToken(null);
      const message = err instanceof Error ? err.message : "Logout failed";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
    isAuthenticated: !!user && !!token,
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
