# Frontend Code Organization

## 📁 Feature-Based Architecture

This project uses a **feature-based architecture** to organize code by business domain rather than technical layer. This approach scales better, improves maintainability, and makes the codebase more intuitive for developers with professional experience.

## Directory Structure

```
src/
├── app/                    # Next.js App Router (routes only)
│   ├── (auth)/            # Auth route group
│   │   ├── login/
│   │   └── register/
│   ├── layout.tsx
│   └── page.tsx
│
├── features/              # Feature modules (business domains)
│   ├── auth/             # Authentication feature
│   │   ├── components/   # Auth-specific components
│   │   ├── context/      # Auth context & provider
│   │   ├── hooks/        # Auth custom hooks
│   │   ├── services/     # Auth API services
│   │   ├── types/        # Auth TypeScript types
│   │   ├── utils/        # Auth utilities (JWT, etc.)
│   │   ├── validations/  # Auth validation schemas
│   │   └── index.ts      # Barrel exports
│   │
│   └── todos/            # Todos feature
│       ├── components/   # Todo components
│       ├── hooks/        # Todo custom hooks  
│       ├── services/     # Todo API services
│       ├── types/        # Todo TypeScript types
│       ├── validations/  # Todo validation schemas
│       └── index.ts      # Barrel exports
│
├── shared/               # Shared/common code
│   ├── components/       # Reusable UI components
│   │   ├── ui/          # shadcn/ui components
│   │   ├── ErrorBoundary.tsx
│   │   ├── Header.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── ...
│   ├── contexts/        # Global contexts
│   │   └── progress.tsx
│   ├── hooks/           # Reusable hooks
│   │   └── useDebounce.ts
│   ├── lib/             # Core libraries
│   │   └── http-client.ts
│   ├── types/           # Common types
│   │   └── common.types.ts
│   ├── utils/           # Utility functions
│   │   ├── utils.ts     # Common utilities (cn, etc.)
│   │   └── utils/       # Categorized utils
│   │       └── todo.ts
│   └── index.ts         # Barrel exports
│
└── index.ts             # Root barrel export
```

## Import Patterns

### ✅ Good - Clean Barrel Imports

```typescript
// Import from feature barrel
import { useAuth, AuthProvider, loginSchema } from '@/features/auth';
import { useTodos, Todo, CreateTodoRequest } from '@/features/todos';

// Import from shared barrel
import { Button, Card, Input } from '@/shared/components/ui/button';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { cn } from '@/shared/utils';
```

### ❌ Bad - Deep Imports

```typescript
// Don't do this
import { useAuth } from '@/features/auth/context/AuthContext';
import { Todo } from '@/features/todos/types/todo.types';
```

### Within a Feature - Use Relative Imports

```typescript
// Inside features/auth/services/auth.service.ts
import { AuthResponse } from '../types/auth.types';
import { httpClient } from '@/shared/lib/http-client';
```

## Benefits of This Structure

### 1. **Scalability**
- Easy to add new features without affecting existing code
- Each feature is self-contained and independent
- Clear boundaries between domains

### 2. **Maintainability**
- All related code is co-located
- Easy to find and modify feature-specific logic
- Reduced coupling between features

### 3. **Developer Experience**
- Intuitive structure for new team members
- Clean imports using barrel exports
- TypeScript path aliases for better DX

### 4. **Testability**
- Features can be tested in isolation
- Mock dependencies at feature boundaries
- Clear separation of concerns

### 5. **Professional Standards**
- Industry best practice for large applications
- Used by companies like Airbnb, Uber, Netflix
- Demonstrates senior-level architecture skills

## Path Aliases

Configured in `tsconfig.json`:

```json
{
  "paths": {
    "@/*": ["./src/*"],
    "@/features/*": ["./src/features/*"],
    "@/shared/*": ["./src/shared/*"],
    "@/app/*": ["./src/app/*"]
  }
}
```

## Feature Module Guidelines

### Each feature should be:
1. **Self-contained**: All feature logic in one place
2. **Exported via index.ts**: Clean barrel exports
3. **Typed**: Comprehensive TypeScript types
4. **Validated**: Zod schemas for data validation
5. **Tested**: (TODO: Add tests for each feature)

### Shared Module Guidelines
- Only truly reusable code belongs here
- Don't create dependencies between features
- Keep it minimal - move feature-specific code to features/

## Adding a New Feature

1. Create feature directory structure:
```bash
mkdir -p src/features/my-feature/{components,hooks,services,types,validations}
```

2. Add feature implementation files

3. Create `index.ts` with barrel exports:
```typescript
export * from './components/MyComponent';
export * from './hooks/useMyFeature';
// ...
```

4. Update root `src/index.ts` if needed

## Migration Notes

This structure was migrated from a flat structure with:
- ✅ All imports updated to use feature-based paths
- ✅ Barrel exports added for clean imports
- ✅ TypeScript compilation verified (no errors)
- ✅ Types properly split between features and shared

## References

- [Feature-Sliced Design](https://feature-sliced.design/)
- [Bulletproof React](https://github.com/alan2207/bulletproof-react)
- [Next.js Project Structure](https://nextjs.org/docs/app/building-your-application/routing/colocation)
