import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnvironment } from './config/environment.validation';
import { HealthController } from './health/health.controller';
import { AuthModule } from './auth/auth.module';
import { AppointmentRequestsModule } from './appointment-requests/appointment-requests.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { ClinicalModule } from './clinical/clinical.module';
import { MedicationsModule } from './medications/medications.module';
import { OwnersModule } from './owners/owners.module';
import { PetsModule } from './pets/pets.module';
import { PrismaModule } from './prisma/prisma.module';
import { ServicesModule } from './services/services.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnvironment,
    }),
    PrismaModule,
    AuthModule,
    AppointmentsModule,
    AppointmentRequestsModule,
    ClinicalModule,
    OwnersModule,
    PetsModule,
    MedicationsModule,
    ServicesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
