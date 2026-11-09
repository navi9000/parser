# Copilot instructions for this repository

## Repo layout

This repository is split into two separate app packages:

- `client/`: Vue 3 + TypeScript + Vite front end using Vuetify and Vue Router.
- `server/`: NestJS API using Prisma 8 contract-first queries and a Yandex-based parser/domain service.

Use the package-local commands in the relevant directory instead of running commands from the repo root.

## Build, test, and lint commands

From `server/`:

```bash
cd server
pnpm install
pnpm build
pnpm lint
pnpm test
pnpm test:e2e
pnpm exec vitest run src/entities/entities.service.spec.ts
pnpm exec vitest run src/reviews/reviews.service.spec.ts
```

From `client/`:

```bash
cd client
pnpm install
pnpm build
pnpm dev
```

Notes:

- `server/package.json` defines the canonical scripts: `build`, `lint`, `test`, `test:watch`, `test:cov`, `test:e2e`.
- For a single spec, prefer `pnpm exec vitest run <path-to-spec>` rather than the whole suite.
- The project does not define a root workspace script; each package is intended to be run independently.

## High-level architecture

### Backend: NestJS + contract-first Prisma

The API entry point is `server/src/app.module.ts`, which registers the `UsersModule`, `AuthModule`, `EntitiesModule`, and `ReviewsModule`.

The application is built around these data flows:

- `server/src/auth/`: JWT login flow (`AuthService`, `AuthGuard`, `Public` decorator).
- `server/src/users/`: user lookup and creation backed by `db.orm.public.User`.
- `server/src/entities/`: entity lookup and creation, with `YandexService` used to parse company pages and populate metadata.
- `server/src/reviews/`: review creation and entity rating aggregation.
- `server/src/prisma/`: Prisma 8 contract artifacts (`contract.prisma`, `contract.json`, `contract.d.ts`) and `db.ts`.

The contract schema is authoritative in `server/src/prisma/contract.prisma`.
When changing it, regenerate the emitted artifacts with:

```bash
cd server
pnpm contract:emit
```

The generated runtime wrapper is used throughout the server via `db.orm.public.*` instead of hand-written SQL.

### Frontend: Vue app with auth guard logic in the client

The client app is a plain Vue 3 app under `client/src/` with router-driven pages under `client/src/pages/` and domain models under `client/src/entities/`.

Key front-end patterns:

- `client/src/app/routes.ts` declares the route table and redirects unauthenticated users to `/login`.
- `client/src/shared/api.ts` centralizes fetch logic, token storage, and `ApiError` handling.
- `client/src/shared/auth.ts` tracks the client-side authentication state.

The UI expects the server to provide JSON responses and stores the access token in `localStorage` under `parser::access_token`.

### Domain behavior

The application is a company/review parser:

- `EntitiesService.create()` stores an entity and triggers `YandexService.parsePage()`.
- `ReviewsService.create()` creates a review and updates the aggregate `avg_rating` and `review_count` for the entity.
- `YandexService` is the integration point for scraping public company metadata from Yandex pages.

## Key conventions and project-specific patterns

- Keep commands package-local. There is no meaningful root-level build/test workflow for the whole repo.
- Server TypeScript files use ESM-style imports with explicit `.js` extensions, even though the source files are `.ts`.
- Prefer the existing NestJS service patterns (`throw new NotFoundException()`, `ConflictException`, etc.) over ad hoc error handling.
- Prisma 8 usage is contract-first. If you touch the schema or the DB layer, regenerate the contract artifacts before relying on generated types.
- Use `db.orm.public.<Model>` queries instead of raw SQL or custom DB helpers when working in the server.
- The server currently has the global JWT guard commented out in `server/src/auth/auth.module.ts`; do not assume every endpoint is protected by default unless the code explicitly enables the guard.
- The client handles route-level auth checks and token cleanup; keep token handling consistent with `client/src/shared/api.ts`.
- Keep the front-end and server concerns separate: UI changes belong in `client/`, API and DB logic belong in `server/`.

## AI-config context already in the repo

This repo already contains Prisma-focused AI guidance under:

- `server/.agents/skills/prisma-8/SKILL.md`
- `server/.claude/skills/prisma-8/SKILL.md`

If a task touches Prisma contracts, migrations, or the generated DB layer, use those files as the source of truth alongside this instruction file.

## Working style

- Prefer surgical edits in the owning package.
- Validate with the smallest relevant command (for example a single `vitest` file) before broadening scope.
- When changing a Prisma contract, also inspect the generated output and ensure it is refreshed with `pnpm contract:emit`.
