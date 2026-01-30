/**
 * Shared utilities barrel exports
 */

// Components
export { ErrorBoundary } from './components/ErrorBoundary';
export { Header } from './components/Header';
export { ProgressBar } from './components/ProgressBar';
export { ProgressBarWrapper } from './components/ProgressBarWrapper';
export { ProtectedRoute } from './components/ProtectedRoute';
export { ScreenReaderAnnouncer, useScreenReaderAnnounce } from './components/ScreenReaderAnnouncer';

// Contexts
export { ProgressProvider, useProgress } from './contexts/progress';

// Hooks
export { useDebounce } from './hooks/useDebounce';

// Lib
export { httpClient } from './lib/http-client';

// Types
export type { PaginatedResponse, ApiError } from './types/common.types';

// Utils - re-export from the utils folder
export * from './utils';
