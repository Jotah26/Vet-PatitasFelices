BEGIN;

DO $$
DECLARE
  veterinarian_role_id INTEGER;
  veterinarian_id INTEGER;
  owner_id INTEGER;
  pet_id INTEGER;
  cancelled_appointment_id INTEGER;
  linked_appointment_id INTEGER;
  duplicate_slot_rejected BOOLEAN := FALSE;
BEGIN
  INSERT INTO "roles" ("key", "updated_at")
  VALUES ('vet', CURRENT_TIMESTAMP)
  ON CONFLICT ("key") DO UPDATE SET "updated_at" = EXCLUDED."updated_at"
  RETURNING "id" INTO veterinarian_role_id;

  INSERT INTO "users" ("name", "email", "password_hash", "role_id", "updated_at")
  VALUES ('B04 verification veterinarian', 'b04-vet@example.invalid', 'non-authenticating-verification-hash', veterinarian_role_id, CURRENT_TIMESTAMP)
  RETURNING "id" INTO veterinarian_id;

  INSERT INTO "owners" ("name", "document_number", "phone", "email", "address", "updated_at")
  VALUES ('B04 verification owner', 'B04-VERIFICATION-OWNER', '555-0100', 'b04-owner@example.invalid', 'Verification address', CURRENT_TIMESTAMP)
  RETURNING "id" INTO owner_id;

  INSERT INTO "pets" ("name", "species", "breed", "sex", "age", "color", "weight", "medical_background", "owner_id", "updated_at")
  VALUES ('B04 verification pet', 'Perro', 'Mixed', 'Macho', '3 years', 'Brown', '10 kg', 'None', owner_id, CURRENT_TIMESTAMP)
  RETURNING "id" INTO pet_id;

  INSERT INTO "appointments" ("scheduled_at", "pet_id", "veterinarian_id", "reason", "updated_at")
  VALUES ('2030-01-15 10:00:00', pet_id, veterinarian_id, 'Verification appointment', CURRENT_TIMESTAMP);

  BEGIN
    INSERT INTO "appointments" ("scheduled_at", "pet_id", "veterinarian_id", "reason", "updated_at")
    VALUES ('2030-01-15 10:00:00', pet_id, veterinarian_id, 'Duplicate active appointment', CURRENT_TIMESTAMP);
  EXCEPTION WHEN unique_violation THEN
    duplicate_slot_rejected := TRUE;
  END;

  IF NOT duplicate_slot_rejected THEN
    RAISE EXCEPTION 'active veterinarian scheduling conflict was not rejected';
  END IF;

  INSERT INTO "appointments" ("scheduled_at", "pet_id", "veterinarian_id", "reason", "status", "updated_at")
  VALUES ('2030-01-15 10:00:00', pet_id, veterinarian_id, 'Cancelled appointment', 'Cancelada', CURRENT_TIMESTAMP)
  RETURNING "id" INTO cancelled_appointment_id;

  INSERT INTO "appointment_requests" ("owner_id", "pet_id", "scheduled_at", "reason", "resolution_state", "resolved_appointment_id", "resolved_at", "updated_at")
  VALUES (owner_id, pet_id, '2030-01-15 10:00:00', 'Verification request', 'Aceptada', cancelled_appointment_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  RETURNING "resolved_appointment_id" INTO linked_appointment_id;

  IF linked_appointment_id IS DISTINCT FROM cancelled_appointment_id THEN
    RAISE EXCEPTION 'resolved request was not linked to its appointment';
  END IF;
END $$;

ROLLBACK;
