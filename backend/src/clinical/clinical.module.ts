import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ClinicalAttentionsController } from './clinical-attentions.controller';
import { ClinicalService } from './clinical.service';
import { ConsultationsController } from './consultations.controller';
import { PrescriptionsController } from './prescriptions.controller';
import { VaccinesController } from './vaccines.controller';

@Module({
  imports: [AuthModule],
  controllers: [ClinicalAttentionsController, ConsultationsController, VaccinesController, PrescriptionsController],
  providers: [ClinicalService],
})
export class ClinicalModule {}
