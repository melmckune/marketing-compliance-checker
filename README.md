# marketing-compliance-checker

ClearPath Financial compliance marketing review tool. See [`CLAUDE.md`](./CLAUDE.md) for full project context.

## Database setup

Stack: [Neon](https://neon.tech) Postgres + [Drizzle ORM](https://orm.drizzle.team) (`drizzle-kit` for migrations).

1. Create a free Neon project at [neon.tech](https://neon.tech), then copy its pooled connection string.
2. Copy the env template and paste the connection string in:
   ```bash
   cp .env.example .env.local
   ```
3. Install dependencies (if you haven't already):
   ```bash
   npm install
   ```
4. Apply the schema to your database:
   ```bash
   npm run db:migrate
   ```
5. Seed demo data (12 realistic submissions — clean, borderline, and rule-tripping — covering every status, severity, and the resubmit flow):
   ```bash
   npm run db:seed
   ```

### Useful scripts

| Script | Purpose |
| --- | --- |
| `npm run db:generate` | Generate a new SQL migration from `src/db/schema.ts` after editing it |
| `npm run db:migrate` | Apply pending migrations to the database in `DATABASE_URL` |
| `npm run db:push` | Push schema directly without a migration file (fast local iteration only) |
| `npm run db:studio` | Open Drizzle Studio, a GUI browser for the database |
| `npm run db:seed` | Wipe and reseed demo data |
| `npm run db:verify-seed` | Sanity-check `src/db/seed-data.ts` with no DB connection required |

### Schema overview

- **`submissions`** — one row per ad asset, holding current status and a denormalized copy of the latest version's title/content (so list/queue views don't need a join).
- **`submission_versions`** — one immutable row per draft (initial submit + each resubmit). This is the source of truth for history/diffing.
- **`flags`** — one row per flagged span, tied to the specific `submission_version` it was found in (not just the submission), so flags never linger against a version that's already been revised.
- **`reviews`** — one row per decision, also tied to the specific version reviewed.

## App

```bash
npm run dev
```
