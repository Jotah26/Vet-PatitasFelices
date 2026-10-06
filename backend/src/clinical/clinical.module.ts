import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AttachmentsController } from './attachments.controller';
import { AttachmentsService } from './attachments.service';
import { ClinicalAttentionsController } from './clinical-attentions.controller';
import { ClinicalService } from './clinical.service';
import { ConsultationAttachmentsController } from './consultation-attachments.controller';
import { ConsultationsController } from './consultations.controller';
import { PrescriptionsController } from './prescriptions.controller';
import { VaccinesController } from './vaccines.controller';

@Module({
  imports: [AuthModule],
  controllers: [
    ClinicalAttentionsController,
    ConsultationAttachmentsController,
    AttachmentsController,
    ConsultationsController,
    VaccinesController,
    PrescriptionsController,
  ],
  providers: [ClinicalService, AttachmentsService],
})
export class ClinicalModule {}
