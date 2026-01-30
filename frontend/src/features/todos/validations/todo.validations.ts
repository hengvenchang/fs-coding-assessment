import { z } from "zod";

/**
 * Todo-related Zod validation schemas
 */

export const createTodoSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be at most 200 characters"),
  description: z
    .string()
    .max(1000, "Description must be at most 1000 characters")
    .optional(),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
  due_date: z.string().optional(),
});

export const updateTodoSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be at most 200 characters"),
  description: z
    .string()
    .max(1000, "Description must be at most 1000 characters")
    .optional(),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
  completed: z.boolean().optional(),
  due_date: z.string().optional(),
});

export type CreateTodoFormData = z.infer<typeof createTodoSchema>;
export type UpdateTodoFormData = z.infer<typeof updateTodoSchema>;
