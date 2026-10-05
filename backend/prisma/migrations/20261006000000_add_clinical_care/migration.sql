-- CreateEnum
CREATE TYPE "ClinicalAttentionType" AS ENUM ('Consulta general', 'Vacunación', 'Control / seguimiento', 'Cirugía', 'Urgencia', 'Desparasitación');

-- CreateEnum
CREATE TYPE "ConsultationStatus" AS ENUM ('Completada', 'En seguimiento');

-- CreateEnum
CREATE TYPE "PrescriptionStatus" AS ENUM ('Emitida', 'Dispensada');

-- CreateTable
CREATE TABLE "consultations" (
    "id" SERIAL NOT NULL,
    "pet_id" INTEGER NOT NULL,
    "veterinarian_id" INTEGER NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "ClinicalAttentionType" NOT NULL,
    "diagnosis" TEXT NOT NULL,
    "treatment" TEXT NOT NULL,
    "recommendations" TEXT NOT NULL,
    "status" "ConsultationStatus" NOT NULL DEFAULT 'Completada',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consultations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vaccines" (
    "id" SERIAL NOT NULL,
    "pet_id" INTEGER NOT NULL,
    "consultation_id" INTEGER,
    "name" TEXT NOT NULL,
    "administered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "next_due_at" TIMESTAMP(3),
    "administered_by_id" INTEGER,
    "batch" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vaccines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescriptions" (
    "id" SERIAL NOT NULL,
    "pet_id" INTEGER NOT NULL,
    "veterinarian_id" INTEGER NOT NULL,
    "consultation_id" INTEGER,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "instructions" TEXT,
    "status" "PrescriptionStatus" NOT NULL DEFAULT 'Emitida',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescription_items" (
    "id" SERIAL NOT NULL,
    "prescription_id" INTEGER NOT NULL,
    "medication" TEXT NOT NULL,
    "dose" TEXT NOT NULL,
    "days" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prescription_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "consultations_pet_id_idx" ON "consultations"("pet_id");

-- CreateIndex
CREATE INDEX "consultations_veterinarian_id_idx" ON "consultations"("veterinarian_id");

-- CreateIndex
CREATE INDEX "vaccines_pet_id_idx" ON "vaccines"("pet_id");

-- CreateIndex
CREATE INDEX "vaccines_consultation_id_idx" ON "vaccines"("consultation_id");

-- CreateIndex
CREATE INDEX "prescriptions_pet_id_idx" ON "prescriptions"("pet_id");

-- CreateIndex
CREATE INDEX "prescriptions_veterinarian_id_idx" ON "prescriptions"("veterinarian_id");

-- CreateIndex
CREATE INDEX "prescriptions_consultation_id_idx" ON "prescriptions"("consultation_id");

-- CreateIndex
CREATE INDEX "prescription_items_prescription_id_idx" ON "prescription_items"("prescription_id");

-- AddForeignKey
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_veterinarian_id_fkey" FOREIGN KEY ("veterinarian_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vaccines" ADD CONSTRAINT "vaccines_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vaccines" ADD CONSTRAINT "vaccines_consultation_id_fkey" FOREIGN KEY ("consultation_id") REFERENCES "consultations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vaccines" ADD CONSTRAINT "vaccines_administered_by_id_fkey" FOREIGN KEY ("administered_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_veterinarian_id_fkey" FOREIGN KEY ("veterinarian_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_consultation_id_fkey" FOREIGN KEY ("consultation_id") REFERENCES "consultations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescription_items" ADD CONSTRAINT "prescription_items_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "prescriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
