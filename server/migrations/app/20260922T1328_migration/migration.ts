#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/92d36f8333aa3f63a128013d72681af1e29e8c782cae862b9d4fb581c91ad0ac/contract';
import endContract from '../../snapshots/92d36f8333aa3f63a128013d72681af1e29e8c782cae862b9d4fb581c91ad0ac/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'public' }),
      this.createTable({
        schema: 'public',
        table: 'entity',
        columns: [
          col('avg_rating', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('review_count', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('url', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'review',
        columns: [
          col('author', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('entity_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('rating', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('text', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'user',
        columns: [
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('login', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('password', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'entity',
        constraint: 'entity_url_key',
        columns: ['url'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'user',
        constraint: 'user_login_key',
        columns: ['login'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'review',
        index: 'review_entity_id_idx_5948f79a',
        columns: ['entity_id'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'review',
        foreignKey: {
          name: 'review_entity_id_fkey',
          columns: ['entity_id'],
          references: { schema: 'public', table: 'entity', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
