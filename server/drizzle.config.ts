import { defineConfig } from 'drizzle-kit'

/**
 * Drizzle Kit config for schema introspection and generating migrations.
 * - Schema changes: edit src/db/schema.ts, then run `npm run db:generate`.
 * - D1 apply: run `npm run db:migrate` (wrangler d1 migrations apply).
 *
 * Note: drizzle-kit generate creates a timestamped subfolder under out/ with migration.sql.
 * For wrangler, we use hand-written migrations in migrations/0000_*.sql, 0001_*.sql.
 * For future changes: run db:generate, then copy the new migration.sql into
 * migrations/0001_description.sql (next number) so wrangler picks it up.
 */
export default defineConfig({
  schema: './src/db/schema.ts',
  out: './migrations-drizzle',
  dialect: 'sqlite',
})
