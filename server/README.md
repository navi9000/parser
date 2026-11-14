# Server

The API is a NestJS application. Its database schema is defined in
`src/prisma/contract.prisma`; regenerate its Prisma 8 artifacts with
`pnpm contract:emit` after contract changes.

## Scraper queue

Start the local PostgreSQL 15+ and Redis services with `docker compose up -d`.
The PostgreSQL defaults match the example `DATABASE_URL` in `.env.example`.
These defaults are for local development only.

Office scraping runs through BullMQ with Redis. Set `REDIS_URL` in `.env`
(defaults to `redis://127.0.0.1:6379`) if Redis is hosted elsewhere.

New Yandex office URLs and manual refresh requests enqueue asynchronous jobs.
The client polls the job endpoint while a scrape runs. Successful office scrapes
schedule their next refresh 24 hours later; Redis stores the delayed jobs, and
the API restores missing refresh jobs from each office's `last_updated_at` when
it starts.

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
