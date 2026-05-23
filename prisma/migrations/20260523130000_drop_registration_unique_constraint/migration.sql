-- Drop the unique constraint if it exists (for PostgreSQL)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'CheckIn_registrationId_key'
    ) THEN
        ALTER TABLE "CheckIn" DROP CONSTRAINT "CheckIn_registrationId_key";
    END IF;
END $$;

-- Drop the unique index if it exists and wasn't dropped by the constraint
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'CheckIn_registrationId_key'
        AND n.nspname = 'public'
    ) THEN
        DROP INDEX "public"."CheckIn_registrationId_key";
    END IF;
END $$;
