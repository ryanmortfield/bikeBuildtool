# Database migrations (D1)

- **Apply migrations (remote):** `npm run db:migrate`
- **Apply migrations (local):** `npm run db:migrate:local`

## Changing the schema later

1. Edit `src/db/schema.ts` (add/remove columns or tables).
2. Run `npm run db:generate` to create a new migration in `migrations-drizzle/`.
3. Copy the generated `migrations-drizzle/<timestamp>_*/migration.sql` into `migrations/` as the next numbered file, e.g. `migrations/0001_add_my_column.sql`.
4. Run `npm run db:migrate` (or `db:migrate:local`) to apply.

Wrangler applies every `migrations/*.sql` file in order by filename; the first run used `0000_initial.sql`.
