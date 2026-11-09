import 'dotenv/config';
import postgres from '@prisma/orm-postgres/runtime';
import type { Contract } from './contract.d.ts';
import contractJson from './contract.json' with { type: 'json' };

// The emitted declaration omits this relation flag, but contract.json includes it.
type RuntimeContract = Contract & {
  domain: {
    namespaces: {
      public: {
        models: {
          Review: {
            relations: {
              entity: { nullable: false };
            };
          };
        };
      };
    };
  };
};

export const db = postgres<RuntimeContract>({
  contractJson,
  url: process.env['DATABASE_URL']!,
});
