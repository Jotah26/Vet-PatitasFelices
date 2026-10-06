-- Add the column as nullable so this migration remains deployable for databases
-- that already contain users.
ALTER TABLE "users" ADD COLUMN "password_hash" TEXT;

-- The value is an Argon2id hash of a cryptographically random secret that was
-- discarded when this migration was authored. Existing users therefore cannot
-- authenticate until an administrator explicitly resets their password.
UPDATE "users"
SET "password_hash" = '$argon2id$v=19$m=65536,p=4,t=3$RZ99e4V6pojbFbjOKCif7Q$8l1eAFqbMU75MzI9vawLMjRy+kkEmsEspIGhAgfrJd0'
WHERE "password_hash" IS NULL;

ALTER TABLE "users" ALTER COLUMN "password_hash" SET NOT NULL;
