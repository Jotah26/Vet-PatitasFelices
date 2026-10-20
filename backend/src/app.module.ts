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
import { PaymentsModule } from './payments/payments.module';
import { PetsModule } from './pets/pets.module';
import { PrismaModule } from './prisma/prisma.module';
import { RemindersModule } from './reminders/reminders.module';
import { ServicesModule } from './services/services.module';
import { UsersModule } from './users/users.module';
import { SetupModule } from './setup/setup.module';

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
    PaymentsModule,
    RemindersModule,
    ServicesModule,
    UsersModule,
    SetupModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
