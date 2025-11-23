# Testing Setup

## Overview
Testing infrastructure using Vitest and React Testing Library with pre-commit hooks.

## Running Tests

```bash
# Run all tests once
npm test

# Watch mode for development
npm run test:watch

# Open test UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

## Test Files Created

- `tests/components/Header.test.tsx` - Header component tests
- `tests/components/NotificationsPanel.test.tsx` - Notifications panel tests
- `tests/services/userService.test.ts` - User service function tests

## Pre-commit Hooks

Husky is configured to run tests automatically before every commit. If tests fail, the commit will be blocked.

To skip pre-commit hooks (not recommended):
```bash
git commit --no-verify
```

## Configuration Files

- `vitest.config.ts` - Vitest configuration
- `tests/setup.ts` - Global test setup with mocks
- `.lintstagedrc.json` - Lint-staged configuration
- `.husky/pre-commit` - Pre-commit hook script

## Writing New Tests

Place test files next to the code they test or in the `tests/` directory:
```
tests/
  components/
    YourComponent.test.tsx
  services/
    yourService.test.ts
```

Follow the naming convention: `*.test.ts` or `*.test.tsx`
