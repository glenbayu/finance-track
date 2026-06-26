# Finance Tracker

Finance Tracker is a personal finance web app for recording income and expenses, tracking monthly budgets, reviewing reports, and using quick-add templates from both desktop and mobile devices.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Supabase Auth + Database
- Recharts
- Lucide React
- PWA support

## Main Features

- Dashboard with monthly summary, expense distribution, quick add, and recent history
- Transaction list with search, filters, sort, pagination, and mobile-friendly controls
- Add, edit, duplicate, and delete transactions
- Budget monitoring by month and category
- Category management
- Reports and analytics
- Quick-add templates
- Theme toggle
- Idle session auto logout after 10 minutes of inactivity
- PWA install support

## Folder Guide

This repository now follows a simple separation:

- `app/`
  Next.js routes, layouts, loading boundaries, and API routes
- `components/`
  Reusable UI and feature-level React components
- `lib/`
  Shared business logic, Supabase helpers, utilities, and server actions
- `hooks/`
  Client hooks
- `public/`
  Static assets and PWA files
- `supabase/migrations/`
  Database schema migrations

## Project Structure

```text
finance-track/
|-- app/
|   |-- (app)/
|   |   |-- budgets/
|   |   |-- categories/
|   |   |-- more/
|   |   |-- reports/
|   |   |-- settings/
|   |   |   |-- templates/
|   |   |-- transactions/
|   |   |   |-- [id]/edit/
|   |   |   |-- new/
|   |   |-- layout.tsx
|   |   |-- loading.tsx
|   |   |-- page.tsx
|   |-- api/
|   |   |-- session/
|   |   |   |-- activity/
|   |   |   `-- logout/
|   |-- login/
|   |-- signup/
|   |-- error.tsx
|   |-- globals.css
|   |-- layout.tsx
|   |-- loading.tsx
|   `-- not-found.tsx
|-- components/
|   |-- auth/
|   |-- budgets/
|   |-- dashboard/
|   |-- layout/
|   |-- pwa/
|   |-- quick-add/
|   |-- reports/
|   |-- settings/
|   |-- transactions/
|   `-- ui/
|-- hooks/
|-- lib/
|   |-- actions/
|   |   `-- quick-add.ts
|   |-- auth/
|   |-- reports/
|   |-- supabase/
|   |-- currency.ts
|   |-- date.ts
|   |-- exchange-rates.ts
|   |-- format.ts
|   |-- preferences.ts
|   `-- quick-add.ts
|-- public/
|   |-- apple-touch-icon.png
|   |-- favicon.svg
|   |-- icon-192.png
|   |-- icon-512.png
|   |-- manifest.webmanifest
|   `-- sw.js
|-- supabase/
|   `-- migrations/
|-- proxy.ts
|-- package.json
`-- tsconfig.json
```

## Important Architectural Notes

### 1. App route grouping

- `app/(app)` contains authenticated application pages
- `app/login` and `app/signup` stay outside the authenticated shell
- `app/api` contains session endpoints used by the idle timeout flow

### 2. Desktop shell

- Desktop sidebar is handled by the persistent layout in `app/(app)/layout.tsx`
- Shared desktop navigation lives in `components/layout/`
- Page-level header/content wrapper lives in `components/layout/app-shell.tsx`

### 3. Quick add

- UI lives in `components/quick-add/`
- shared mapping helpers live in `lib/quick-add.ts`
- server actions for quick add now live in `lib/actions/quick-add.ts`

### 4. Idle session handling

- `components/auth/idle-session-guard.tsx` handles client-side inactivity tracking
- `proxy.ts` enforces protected route access and validates idle expiration on incoming requests
- `app/api/session/activity/route.ts` refreshes last-activity cookie
- `app/api/session/logout/route.ts` performs logout and clears idle cookie

## Development Setup

### Prerequisites

- Node.js 20+
- npm
- A Supabase project

### Environment Variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Install

```bash
npm install
```

### Run locally

```bash
npm run dev
```

App URL:

```text
http://localhost:3000
```

## Available Scripts

```bash
npm run dev
npm run lint
npm run build
npm run start
```

## Database and Migrations

Supabase migrations are stored in:

```text
supabase/migrations/
```

This project includes migrations for:

- budgets
- quick add templates
- quick add usage tracking
- category archive support
- `updated_at` columns and triggers

## Conventions Used In This Repo

- Route files stay inside `app/`
- Feature components stay inside `components/<feature>/`
- Shared primitive or presentational components stay inside `components/ui/`
- Server-only helpers and reusable business logic stay inside `lib/`
- Server actions should be placed near the business domain they belong to, not scattered in route roots
- Mobile and desktop variations may live in the same feature folder when they serve the same page

## Suggested Onboarding Path

If you are new to the codebase, read files in this order:

1. `app/layout.tsx`
2. `app/(app)/layout.tsx`
3. `components/layout/app-shell.tsx`
4. `app/(app)/page.tsx`
5. `app/(app)/transactions/page.tsx`
6. `lib/supabase/auth.ts`
7. `proxy.ts`

## Current Cleanup Outcome

Recent organization cleanup includes:

- authenticated pages grouped under `app/(app)`
- persistent desktop shell isolated in layout components
- quick-add server actions moved from `app/quick-add/actions.ts` to `lib/actions/quick-add.ts`
- README rewritten to make the repository easier to navigate

## Notes

- PWA assets live in `public/`
- The app uses Indonesian UI copy in most screens
- The current design system is intentionally shared across desktop and mobile, with mobile-specific controls in transaction and dashboard flows
