/**
 * Shared/common TypeScript types used across features
 */

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}

export interface ApiError {
  detail: string | { [key: string]: string[] };
}
