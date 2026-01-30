/**
 * Auth feature barrel exports
 */

// Context
export { AuthProvider, useAuth } from './context/AuthContext';

// Services
export { authService } from './services/auth.service';

// Types
export type {
  User,
  AuthToken,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  JWTPayload,
} from './types/auth.types';

// Validations
export {
  loginSchema,
  registerSchema,
  type LoginFormData,
  type RegisterFormData,
} from './validations/auth.validations';

// Utils
export {
  decodeJWT,
  isTokenExpired,
  getUserIdFromToken,
  getUsernameFromToken,
} from './utils/jwt';
