# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Start Expo dev server
npm run ios        # Start with iOS simulator
npm run android    # Start with Android emulator
npm run web        # Start web version
npm run lint       # Run Expo's built-in linter
npm test           # Run all Jest tests
npx jest path/to/file.test.ts  # Run a single test file
```

## Architecture

This is an **Expo (React Native) app** using **expo-router** for file-based routing, **Supabase** for authentication, and **Zustand** for client state management.

### Routing (expo-router)

Routes map to files under `app/`:
- `app/_layout.tsx` — root layout: checks Supabase session on mount (via `useAuthStore.checkSession()`), redirects to `/(protected)` if user exists, otherwise shows the auth screens (login/register)
- `app/login.tsx` / `app/register.tsx` — public auth screens
- `app/(protected)/_layout.tsx` — authenticated route group wrapper
- `app/(protected)/index.tsx` — main todo list (home screen)

### State Management (Zustand)

Two stores in `stores/`:
- **`authStore.ts`** — wraps Supabase Auth: `signUp`, `signIn`, `signOut`, `checkSession` (restores session from AsyncStorage-backed Supabase client). Components read `user`, `isLoading`, `error`.
- **`todoStore.ts`** — CRUD for todos persisted locally to **AsyncStorage** (key: `mytodo_todos`). On `addTodo`, calls `categorizeTodo()` from `utils/category.ts` to auto-tag the todo. Todos are NOT stored in Supabase — auth is remote, data is local.

### Services

- `services/supabase.ts` — single Supabase client instance configured with AsyncStorage for session persistence and `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` env vars

### Types & Utilities

- `types/index.ts` — `Todo` and `User` interfaces
- `utils/category.ts` — keyword-based todo categorization (work/sport/investment/life); `categorizeTodo(content)` returns a category or `null`

### Path Alias

`@/*` maps to the project root (configured in `tsconfig.json`).

## Testing

- Jest with `react-native` preset
- Tests mirror source structure under `tests/`
- Store tests use `@testing-library/react-hooks` with `renderHook` + `act`
- Mock AsyncStorage in tests that exercise `todoStore` or any AsyncStorage-dependent code
