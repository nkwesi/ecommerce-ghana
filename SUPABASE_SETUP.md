# Supabase database setup

Supabase will provide the production PostgreSQL database. The NestJS API remains the only trusted application layer; the browser does not receive the database password or a Supabase service-role key.

## 1. Create the project

1. Create a Supabase project in the region closest to the backend hosting region.
2. Save the database password in a password manager.
3. In the Supabase dashboard, select **Connect**.
4. Copy the **Session pooler** connection string for the deployed NestJS backend. It uses port `5432` and works from IPv4 hosting platforms.
5. Copy the **Direct connection** string separately for migrations if the machine running migrations supports IPv6. Otherwise, use the Session pooler for the first migration.

Do not use the transaction pooler on port `6543` for TypeORM migrations.

## 2. Backend environment

```env
# Runtime: Supabase Session pooler
DATABASE_URL=postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres
DATABASE_SSL=true
DATABASE_SSL_REJECT_UNAUTHORIZED=true
DATABASE_POOL_MAX=10

# Optional: direct connection used only by migration commands
MIGRATION_DATABASE_URL=postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres
```

If strict certificate verification fails on the deployment platform, download the database CA certificate from Supabase Database Settings, base64-encode the full certificate, and set `DATABASE_CA_CERT_BASE64`. Do not solve certificate errors by disabling SSL.

Passwords containing reserved URL characters must be percent-encoded in the URI.

## 3. Generate the initial schema migration

The project must be empty when generating the first migration.

```bash
cd backend
npm run migration:generate
```

Review the generated SQL under `src/database/migrations`, then apply it:

```bash
npm run migration:run
```

Commit the generated migration. Production must keep TypeORM `synchronize` disabled.

## 4. Load mock inventory

After the migration is applied, run the seed script against Supabase only if the database contains no business data:

```bash
npx ts-node src/database/seed.ts
```

The storefront mock SKUs and database seed SKUs must be aligned before enabling API checkout. Keep `NEXT_PUBLIC_CHECKOUT_MODE=demo` until that alignment and a complete test order pass.

## 5. Production checks

- Confirm `/api/v1/health` responds successfully.
- Confirm the API can list products and create inventory reservations.
- Confirm the deployed API uses the pooler connection, not a browser-exposed credential.
- Confirm Supabase backups are active for the chosen plan.
- Run one low-value Paystack transaction and reconcile the order, payment, and inventory rows.
- Review database connection use in Supabase Observability after the first traffic test.

## Scope decision

This setup uses **Supabase Database only**. Existing JWT/admin authentication stays in NestJS, and product images remain static during the mock-catalog phase. Supabase Auth and Storage can be adopted later as separate, tested changes.
