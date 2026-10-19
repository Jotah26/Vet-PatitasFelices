-- B05.4 payment persistence verification (rollback-scoped, read-only).
BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'payments'
  ) THEN
    RAISE EXCEPTION 'Missing payments table';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'payments'
      AND constraint_name = 'payments_appointment_id_fkey'
  ) THEN
    RAISE EXCEPTION 'Missing payment appointment foreign key';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'PaymentStatus' AND e.enumlabel = 'Anulado'
  ) THEN
    RAISE EXCEPTION 'PaymentStatus enum labels are missing';
  END IF;
END
$$;

ROLLBACK;
