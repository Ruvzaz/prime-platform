# Project Rules for Prime Platform

## Prisma Database Migrations Policy
- Whenever modifying the `prisma/schema.prisma` file (adding, modifying, or removing models, fields, enums, or relations), you MUST automatically:
  1. Synchronize the local/development database using `npx prisma db push`.
  2. Create a corresponding migration directory and `migration.sql` file under `prisma/migrations/YYYYMMDDHHMMSS_<migration_name>/migration.sql`.
  3. Regenerate Prisma Client using `npx prisma generate`.
  4. Verify that TypeScript compilation (`npx tsc --noEmit`) passes cleanly with 0 errors.
