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
      try {
        setIsLoading(true);
        setError(null);
        const response: AuthResponse = await authService.login({ username, password });
        
        const token = response.access_token;
        setToken(token);
        
        // Extract user info from token
        const userId = getUserIdFromToken(token);
        const tokenUsername = getUsernameFromToken(token);
        if (userId && tokenUsername) {
          setUser({ id: userId, username: tokenUsername });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Login failed";
        setError(message);
        setToken(null);
        setUser(null);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const register = useCallback(
    async (username: string, password: string) => {
      try {
        setIsLoading(true);
        setError(null);
        const response: AuthResponse = await authService.register({ username, password });
        
        const token = response.access_token;
        setToken(token);
        
        // Extract user info from token
        const userId = getUserIdFromToken(token);
        const tokenUsername = getUsernameFromToken(token);
        if (userId && tokenUsername) {
          setUser({ id: userId, username: tokenUsername });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Registration failed";
        setError(message);
        setToken(null);
        setUser(null);
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
