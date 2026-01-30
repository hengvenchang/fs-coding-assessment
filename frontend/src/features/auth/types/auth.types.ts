/**
 * Auth-related TypeScript types and interfaces
 */

export interface User {
  id: string;
  username: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface AuthResponse extends AuthToken {
  user?: User;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface JWTPayload {
  sub: string;
  exp: number;
  username?: string;
  [key: string]: unknown;
}
