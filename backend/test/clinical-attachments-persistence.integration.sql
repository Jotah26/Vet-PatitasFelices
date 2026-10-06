-- B05.2 attachment persistence verification (rollback-scoped, read-only).
BEGIN;

DO $$
DECLARE
  missing TEXT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'clinical_attachments'
  ) THEN
    RAISE EXCEPTION 'Missing clinical_attachments table';
  END IF;

  SELECT string_agg(expected, ', ')
  INTO missing
  FROM (
    VALUES
      ('clinical_attachments_consultation_id_fkey'),
      ('clinical_attachments_uploaded_by_id_fkey')
  ) AS e(expected)
  WHERE NOT EXISTS (
    SELECT 1
    FROM information_schema.referential_constraints rc
    JOIN information_schema.table_constraints tc USING (constraint_schema, constraint_name)
    WHERE tc.constraint_schema = 'public'
      AND tc.constraint_name = e.expected
      AND rc.delete_rule = 'RESTRICT'
  );
  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'Missing RESTRICT attachment foreign keys: %', missing;
  END IF;
END
$$;

ROLLBACK;
