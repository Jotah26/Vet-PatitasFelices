-- B05.1 clinical persistence verification (rollback-scoped, read-only).
BEGIN;

DO $$
DECLARE
  missing TEXT;
BEGIN
  SELECT string_agg(expected, ', ')
  INTO missing
  FROM (
    VALUES
      ('consultations'),
      ('vaccines'),
      ('prescriptions'),
      ('prescription_items')
  ) AS e(expected)
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = e.expected
  );
  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'Missing clinical tables: %', missing;
  END IF;

  SELECT string_agg(expected, ', ')
  INTO missing
  FROM (
    VALUES
      ('consultations_pet_id_fkey'),
      ('consultations_veterinarian_id_fkey'),
      ('vaccines_pet_id_fkey'),
      ('vaccines_consultation_id_fkey'),
      ('vaccines_administered_by_id_fkey'),
      ('prescriptions_pet_id_fkey'),
      ('prescriptions_veterinarian_id_fkey'),
      ('prescriptions_consultation_id_fkey'),
      ('prescription_items_prescription_id_fkey')
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
    RAISE EXCEPTION 'Missing RESTRICT clinical foreign keys: %', missing;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'ClinicalAttentionType' AND e.enumlabel = 'Consulta general'
  ) THEN
    RAISE EXCEPTION 'ClinicalAttentionType enum labels are missing';
  END IF;
END
$$;

ROLLBACK;
