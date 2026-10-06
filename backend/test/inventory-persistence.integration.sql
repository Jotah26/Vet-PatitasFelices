-- B05.3 inventory persistence verification (rollback-scoped, read-only).
BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'medications'
  ) THEN
    RAISE EXCEPTION 'Missing medications table';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'services'
  ) THEN
    RAISE EXCEPTION 'Missing services table';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'MedicationCategory' AND e.enumlabel = 'Antibiótico'
  ) THEN
    RAISE EXCEPTION 'MedicationCategory enum labels are missing';
  END IF;
END
$$;

ROLLBACK;
