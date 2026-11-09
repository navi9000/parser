#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/ab47d4403392127be228049948a01a2836527efcc71f017ed0cf189d3fe9783c/contract';
import startContract from '../../snapshots/ab47d4403392127be228049948a01a2836527efcc71f017ed0cf189d3fe9783c/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/d2cc638c2f013d16ecf5157bfa422e1e904f81600ea6653cd28a11e547bdafc3/contract';
import endContract from '../../snapshots/d2cc638c2f013d16ecf5157bfa422e1e904f81600ea6653cd28a11e547bdafc3/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'entity',
        column: col('last_updated_at', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addUnique({
        schema: 'public',
        table: 'entity',
        constraint: 'entity_slug_office_id_key',
        columns: ['slug', 'office_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'review',
        index: 'review_entity_id_timestamp_idx_246e91b3',
        columns: ['entity_id', 'timestamp'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
