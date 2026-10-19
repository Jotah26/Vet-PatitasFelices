import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Reminders vertical', () => {
  let app: INestApplication;
  let staffToken: string;
  let ownerToken: string;
  beforeAll(async () => {
    const prisma = {
      owner: { findUnique: jest.fn(({ where }: { where: { userId: number } }) => where.userId === 10 ? { id: 1 } : null) },
      pet: {
        findMany: jest.fn(({ where }: { where?: { id?: number; ownerId?: number } } = {}) => {
          const pets = [{ id: 1, name: 'Luna', ownerId: 1 }, { id: 2, name: 'Max', ownerId: 2 }];
          return pets.filter((pet) => (where?.id === undefined || pet.id === where.id) && (where?.ownerId === undefined || pet.ownerId === where.ownerId));
        }),
      },
      vaccine: {
        findMany: jest.fn(({ where }: { where?: { petId?: { in: number[] } } } = {}) => {
          const vaccines = [
            { id: 1, petId: 1, name: 'Rabies', nextDueAt: new Date(Date.now() + 5 * 86400000) },
            { id: 2, petId: 2, name: 'Old', nextDueAt: new Date(Date.now() + 90 * 86400000) },
          ];
          return vaccines.filter((vaccine) => !where?.petId || where.petId.in.includes(vaccine.petId));
        }),
      },
      appointment: {
        findMany: jest.fn(({ where }: { where?: { petId?: { in: number[] }; status?: { notIn: string[] }; scheduledAt?: { gte: Date; lte: Date } } } = {}) => {
          const appointments = [{ id: 1, petId: 1, scheduledAt: new Date(Date.now() + 2 * 86400000), status: 'CONFIRMED', reason: 'Control', veterinarianId: 3 }];
          return appointments.filter((appointment) => !where?.petId || where.petId.in.includes(appointment.petId));
        }),
      },
    };
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(PrismaService).useValue(prisma).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
    await app.init();
    const jwt = app.get(JwtService);
    staffToken = await jwt.signAsync({ sub: 12, email: 'staff@example.test', role: 'RECEPTIONIST' });
    ownerToken = await jwt.signAsync({ sub: 10, email: 'owner@example.test', role: 'OWNER' });
  });
  afterAll(async () => app?.close());
  const asStaff = (builder: request.Test) => builder.set('Authorization', `Bearer ${staffToken}`);
  const asOwner = (builder: request.Test) => builder.set('Authorization', `Bearer ${ownerToken}`);

  it('enforces authentication and owner scope', async () => {
    await request(app.getHttpServer()).get('/reminders').expect(401);
    await asOwner(request(app.getHttpServer()).get('/reminders')).expect(200);
    await asOwner(request(app.getHttpServer()).get('/reminders?petId=2')).expect(200).expect([]);
  });

  it('returns due vaccine and appointment reminders and supports staff filters', async () => {
    const ownerReminders = await asOwner(request(app.getHttpServer()).get('/reminders')).expect(200);
    expect(ownerReminders.body).toEqual(expect.arrayContaining([
      expect.objectContaining({ class: 'vaccine', petId: 1 }),
      expect.objectContaining({ class: 'appointment', petId: 1 }),
    ]));
    const staffReminders = await asStaff(request(app.getHttpServer()).get('/reminders?petId=1')).expect(200);
    expect(staffReminders.body).toHaveLength(2);
  });
});
