-- CreateTable
CREATE TABLE "clinical_attachments" (
    "id" SERIAL NOT NULL,
    "consultation_id" INTEGER NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "data_url" TEXT NOT NULL,
    "uploaded_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinical_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "clinical_attachments_consultation_id_idx" ON "clinical_attachments"("consultation_id");

-- AddForeignKey
ALTER TABLE "clinical_attachments" ADD CONSTRAINT "clinical_attachments_consultation_id_fkey" FOREIGN KEY ("consultation_id") REFERENCES "consultations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_attachments" ADD CONSTRAINT "clinical_attachments_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
