# Server

The API is a NestJS application. Its database schema is defined in
`src/prisma/contract.prisma`; regenerate its Prisma 8 artifacts with
`pnpm contract:emit` after contract changes.

## Scraper

Start the local PostgreSQL 15+ service with `docker compose up -d postgres`. The
PostgreSQL defaults match the example `DATABASE_URL` in `.env.example`. These
defaults are for local development only.

Searching for a new Yandex office or manually refreshing an office runs the
scrape synchronously; the API responds after scraping and saving finish.
Automatic periodic refreshes are currently disabled.

BullMQ and Redis dependencies and configuration are retained for later work,
but the BullMQ module registration is commented out in `src/app.module.ts`.
Redis is not required for the current scraper flow.

The generated migration adds a unique `(slug, office_id)` constraint. Before
applying it to a database with existing data, check for duplicate pairs and
resolve any conflicts while preserving their reviews.

The Prisma planner also created a baseline because this repository had a
database ref but no on-disk migration history. For a fresh database, apply the
full migration chain. For an existing database, first verify it matches the
baseline contract and sign it with `pnpm exec prisma db sign <contract-ref>`;
otherwise the baseline would try to create tables that already exist.

## Commands

```bash
pnpm start:dev
pnpm build
pnpm lint
pnpm test
pnpm exec vitest run src/scraping/scraping.utils.spec.ts
pnpm test:e2e
```

After reviewing a generated schema migration and confirming the database is
at the correct starting contract, apply it with `pnpm exec prisma db migrate`.
