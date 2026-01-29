/**
 * Barrel export for all API services
 * Provides a clean import interface
 */

export * from "./client";
export * from "./auth.service";
export * from "./todo.service";

// For backward compatibility
import { authService } from "./auth.service";
import { todoService } from "./todo.service";

export const apiClient = {
  // Auth methods
  register: authService.register.bind(authService),
  login: authService.login.bind(authService),
  getCurrentUser: authService.getCurrentUser.bind(authService),
  logout: authService.logout.bind(authService),
  
  // Todo methods
  getTodos: todoService.getTodos.bind(todoService),
  getTodo: todoService.getTodo.bind(todoService),
  createTodo: todoService.createTodo.bind(todoService),
  updateTodo: todoService.updateTodo.bind(todoService),
  deleteTodo: todoService.deleteTodo.bind(todoService),
};
