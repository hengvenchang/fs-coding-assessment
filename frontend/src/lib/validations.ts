import { z } from "zod";

// Username validation: alphanumeric and underscores, 3-50 chars
const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(50, "Username must be at most 50 characters")
  .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores");

// Password validation: at least 8 chars
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password must be at most 100 characters");

export const loginSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
});

export const registerSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
