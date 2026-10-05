-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('Pendiente', 'Confirmada', 'En sala', 'Atendida', 'Cancelada');

-- CreateEnum
CREATE TYPE "AppointmentRequestResolution" AS ENUM ('Pendiente', 'Aceptada', 'Rechazada');

-- CreateTable
CREATE TABLE "appointments" (
    "id" SERIAL NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "pet_id" INTEGER NOT NULL,
    "veterinarian_id" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'Pendiente',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment_requests" (
    "id" SERIAL NOT NULL,
    "owner_id" INTEGER NOT NULL,
    "pet_id" INTEGER NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "resolution_state" "AppointmentRequestResolution" NOT NULL DEFAULT 'Pendiente',
    "rejection_reason" TEXT,
    "resolved_appointment_id" INTEGER,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointment_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "appointments_pet_id_idx" ON "appointments"("pet_id");

-- CreateIndex
CREATE INDEX "appointments_veterinarian_id_idx" ON "appointments"("veterinarian_id");

-- CreateIndex
CREATE UNIQUE INDEX "appointments_veterinarian_id_scheduled_at_active_key"
ON "appointments"("veterinarian_id", "scheduled_at")
WHERE "status" <> 'Cancelada';

-- CreateIndex
CREATE INDEX "appointment_requests_owner_id_idx" ON "appointment_requests"("owner_id");

-- CreateIndex
CREATE INDEX "appointment_requests_pet_id_idx" ON "appointment_requests"("pet_id");

-- CreateIndex
CREATE UNIQUE INDEX "appointment_requests_resolved_appointment_id_key" ON "appointment_requests"("resolved_appointment_id");

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_veterinarian_id_fkey" FOREIGN KEY ("veterinarian_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_requests" ADD CONSTRAINT "appointment_requests_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "owners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_requests" ADD CONSTRAINT "appointment_requests_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_requests" ADD CONSTRAINT "appointment_requests_resolved_appointment_id_fkey" FOREIGN KEY ("resolved_appointment_id") REFERENCES "appointments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
