ALTER TABLE "appointments" ADD COLUMN "service_id" INTEGER;

CREATE INDEX "appointments_service_id_idx" ON "appointments"("service_id");

ALTER TABLE "appointments" ADD CONSTRAINT "appointments_service_id_fkey"
  FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
