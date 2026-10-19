import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

type Appointment = {
  id: number;
  scheduledAt: Date;
  petId: number;
  veterinarianId: number;
  reason: string;
  status: 'PENDING' | 'CONFIRMED' | 'IN_ROOM' | 'ATTENDED' | 'CANCELLED';
};

describe('Staff appointment lifecycle', () => {
  let app: INestApplication;
  let staffToken: string;
  let ownerToken: string;
  const appointments = new Map<number, Appointment>();
  let nextAppointmentId = 1;
  const pets = new Map([
    [1, { id: 1, ownerId: 101 }],
    [2, { id: 2, ownerId: 202 }],
  ]);
  const conflict = { code: 'P2002' };
  const notFound = { code: 'P2025' };
  const scheduledAt = '2031-02-03T10:00:00.000Z';

  beforeAll(async () => {
    const veterinarians = new Map([
      [1, { id: 1, status: 'ACTIVE', role: { key: 'VETERINARIAN' } }],
      [2, { id: 2, status: 'INACTIVE', role: { key: 'VETERINARIAN' } }],
      [3, { id: 3, status: 'ACTIVE', role: { key: 'RECEPTIONIST' } }],
    ]);
    const prisma = {
      pet: { findUnique: jest.fn(({ where }: { where: { id: number } }) => pets.get(where.id) ?? null) },
      owner: { findUnique: jest.fn(({ where }: { where: { userId: number } }) => (where.userId === 11 ? { id: 101 } : null)) },
      user: { findUnique: jest.fn(({ where }: { where: { id: number } }) => veterinarians.get(where.id) ?? null) },
      appointment: {
        create: jest.fn(({ data }: { data: Omit<Appointment, 'id' | 'status'> & { status?: Appointment['status'] } }) => {
          const status = data.status ?? 'PENDING';
          if (
            status !== 'CANCELLED' &&
            [...appointments.values()].some(
              (appointment) =>
                appointment.veterinarianId === data.veterinarianId &&
                appointment.scheduledAt.getTime() === new Date(data.scheduledAt).getTime() &&
                appointment.status !== 'CANCELLED',
            )
          ) {
            throw conflict;
          }
          const appointment = { id: nextAppointmentId++, ...data, scheduledAt: new Date(data.scheduledAt), status };
          appointments.set(appointment.id, appointment);
          return appointment;
        }),
        findMany: jest.fn((args?: { where?: { pet?: { ownerId?: number } } }) => {
          const ownerId = args?.where?.pet?.ownerId;
          return [...appointments.values()].filter((appointment) => ownerId === undefined || pets.get(appointment.petId)?.ownerId === ownerId);
        }),
        findUnique: jest.fn(({ where }: { where: { id: number } }) => appointments.get(where.id) ?? null),
        update: jest.fn(({ where, data }: { where: { id: number }; data: Partial<Appointment> }) => {
          const appointment = appointments.get(where.id);
          if (!appointment) {
            throw notFound;
          }
          const updated = { ...appointment, ...data };
          if (
            updated.status !== 'CANCELLED' &&
            [...appointments.values()].some(
              (candidate) =>
                candidate.id !== updated.id &&
                candidate.veterinarianId === updated.veterinarianId &&
                candidate.scheduledAt.getTime() === new Date(updated.scheduledAt).getTime() &&
                candidate.status !== 'CANCELLED',
            )
          ) {
            throw conflict;
          }
          appointments.set(updated.id, updated);
          return updated;
        }),
      },
    };

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
    await app.init();

    const jwt = app.get(JwtService);
    staffToken = await jwt.signAsync({ sub: 10, email: 'staff@example.test', role: 'RECEPTIONIST' });
    ownerToken = await jwt.signAsync({ sub: 11, email: 'owner@example.test', role: 'OWNER' });
  });

  afterAll(async () => app?.close());

  const staff = (requestBuilder: request.Test) => requestBuilder.set('Authorization', `Bearer ${staffToken}`);
  const appointmentPayload = (overrides = {}) => ({
    scheduledAt,
    petId: 1,
    veterinarianId: 1,
    reason: 'Annual examination',
    ...overrides,
  });

  it('requires an authenticated staff role', async () => {
    await request(app.getHttpServer()).get('/appointments').expect(401);
    await request(app.getHttpServer()).get('/appointments').set('Authorization', `Bearer ${ownerToken}`).expect(403);
  });

  it('allows owners to read only appointments for pets they own', async () => {
    appointments.set(1, { id: 1, scheduledAt: new Date(scheduledAt), petId: 1, veterinarianId: 1, reason: 'Owned pet', status: 'PENDING' });
    appointments.set(2, { id: 2, scheduledAt: new Date('2031-02-03T13:00:00.000Z'), petId: 2, veterinarianId: 1, reason: 'Other owner', status: 'PENDING' });

    const ownerAppointments = await request(app.getHttpServer())
      .get('/appointments/mine')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expect(ownerAppointments.body).toEqual([expect.objectContaining({ petId: 1 })]);
    expect(ownerAppointments.body).not.toEqual(expect.arrayContaining([expect.objectContaining({ petId: 2 })]));
    appointments.clear();
    nextAppointmentId = 1;
  });

  it('rejects inactive and non-veterinarian assignments', async () => {
    await staff(request(app.getHttpServer()).post('/appointments')).send(appointmentPayload({ veterinarianId: 2 })).expect(400);
    await staff(request(app.getHttpServer()).post('/appointments')).send(appointmentPayload({ veterinarianId: 3 })).expect(400);
  });

  it('creates, reads, updates, transitions, and cancels appointments', async () => {
    const created = await staff(request(app.getHttpServer()).post('/appointments')).send(appointmentPayload()).expect(201);
    expect(created.body).toMatchObject({ id: 1, status: 'PENDING', veterinarianId: 1 });
    const appointmentsResponse = await staff(request(app.getHttpServer()).get('/appointments')).expect(200);
    expect(appointmentsResponse.body).toEqual([expect.objectContaining({ id: 1 })]);
    await staff(request(app.getHttpServer()).get('/appointments/1')).expect(200);
    await staff(request(app.getHttpServer()).patch('/appointments/1')).send({ reason: 'Updated reason' }).expect(200);
    await staff(request(app.getHttpServer()).patch('/appointments/1/status')).send({ status: 'CONFIRMED' }).expect(200);
    await staff(request(app.getHttpServer()).patch('/appointments/1/status')).send({ status: 'IN_ROOM' }).expect(200);
    await staff(request(app.getHttpServer()).patch('/appointments/1/status')).send({ status: 'ATTENDED' }).expect(200);
    await staff(request(app.getHttpServer()).patch('/appointments/1/status')).send({ status: 'CANCELLED' }).expect(400);

    const cancellable = await staff(request(app.getHttpServer()).post('/appointments'))
      .send(appointmentPayload({ scheduledAt: '2031-02-03T11:00:00.000Z' }))
      .expect(201);
    const cancelled = await staff(request(app.getHttpServer()).post(`/appointments/${cancellable.body.id}/cancel`)).expect(200);
    expect(cancelled.body).toEqual(expect.objectContaining({ status: 'CANCELLED' }));
  });

  it('reopens cancelled slots and maps active scheduling conflicts to 409', async () => {
    await staff(request(app.getHttpServer()).post('/appointments')).send(appointmentPayload({ scheduledAt: '2031-02-03T11:00:00.000Z' })).expect(201);
    await staff(request(app.getHttpServer()).post('/appointments')).send(appointmentPayload({ scheduledAt: '2031-02-03T12:00:00.000Z' })).expect(201);
    await staff(request(app.getHttpServer()).post('/appointments')).send(appointmentPayload({ scheduledAt: '2031-02-03T12:00:00.000Z' })).expect(409);
  });
});
