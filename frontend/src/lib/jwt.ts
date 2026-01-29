/**
 * JWT Token utilities for decoding and validating tokens
 */

interface JWTPayload {
  sub: string;
  exp: number;
  [key: string]: any;
}

/**
 * Decode JWT token (without verification - for client-side use only)
 * JWT format: header.payload.signature
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];
    // Add padding if needed
    const padded = payload + "==".substring(0, (4 - (payload.length % 4)) % 4);
    const decoded = atob(padded);
    return JSON.parse(decoded) as JWTPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJWT(token);
  if (!payload) {
    return true;
  }

  // exp is in seconds, Date.now() is in milliseconds
  const expiryTime = payload.exp * 1000;
  return Date.now() >= expiryTime;
}

/**
 * Get user ID from token
 */
export function getUserIdFromToken(token: string): string | null {
  const payload = decodeJWT(token);
  return payload?.sub || null;
}

/**
 * Get username from token
 */
export function getUsernameFromToken(token: string): string | null {
  const payload = decodeJWT(token);
  return payload?.username || null;
}
