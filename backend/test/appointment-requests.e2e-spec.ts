import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

type RequestState = 'PENDING' | 'ACCEPTED' | 'REJECTED';
type AppointmentRequest = {
  id: number;
  ownerId: number;
  petId: number;
  scheduledAt: Date;
  reason: string;
  resolutionState: RequestState;
  rejectionReason: string | null;
  resolvedAppointmentId: number | null;
  resolvedAt: Date | null;
};

describe('Owner appointment requests and staff resolution', () => {
  let app: INestApplication;
  let ownerToken: string;
  let otherOwnerToken: string;
  let staffToken: string;
  const requests = new Map<number, AppointmentRequest>();
  const appointments: Array<{ veterinarianId: number; scheduledAt: Date }> = [];
  let nextRequestId = 1;

  beforeAll(async () => {
    const owners = new Map([
      [10, { id: 1, userId: 10 }],
      [11, { id: 2, userId: 11 }],
    ]);
    const pets = new Map([
      [1, { id: 1, ownerId: 1 }],
      [2, { id: 2, ownerId: 2 }],
    ]);
    const transaction = {
      owner: { findUnique: jest.fn(({ where }: { where: { userId: number } }) => owners.get(where.userId) ?? null) },
      pet: { findUnique: jest.fn(({ where }: { where: { id: number } }) => pets.get(where.id) ?? null) },
      user: {
        findUnique: jest.fn(({ where }: { where: { id: number } }) =>
          where.id === 3 ? { id: 3, status: 'ACTIVE', role: { key: 'VETERINARIAN' } } : null,
        ),
      },
      appointmentRequest: {
        findMany: jest.fn(({ where }: { where?: { ownerId?: number } } = {}) =>
          [...requests.values()].filter((item) => where?.ownerId === undefined || item.ownerId === where.ownerId),
        ),
        findUnique: jest.fn(({ where }: { where: { id: number } }) => requests.get(where.id) ?? null),
        create: jest.fn(({ data }: { data: Omit<AppointmentRequest, 'id' | 'resolutionState' | 'rejectionReason' | 'resolvedAppointmentId' | 'resolvedAt'> }) => {
          const item: AppointmentRequest = {
            id: nextRequestId++,
            ...data,
            scheduledAt: new Date(data.scheduledAt),
            resolutionState: 'PENDING',
            rejectionReason: null,
            resolvedAppointmentId: null,
            resolvedAt: null,
          };
          requests.set(item.id, item);
          return item;
        }),
        updateMany: jest.fn(({ where, data }: { where: { id: number; resolutionState: RequestState }; data: Partial<AppointmentRequest> }) => {
          const item = requests.get(where.id);
          if (!item || item.resolutionState !== where.resolutionState) return { count: 0 };
          requests.set(item.id, { ...item, ...data });
          return { count: 1 };
        }),
        update: jest.fn(({ where, data }: { where: { id: number }; data: Partial<AppointmentRequest> }) => {
          const item = requests.get(where.id);
          if (!item) throw { code: 'P2025' };
          const updated = { ...item, ...data };
          requests.set(item.id, updated);
          return updated;
        }),
      },
      appointment: {
        create: jest.fn(({ data }: { data: { veterinarianId: number; scheduledAt: Date } }) => {
          if (appointments.some((item) => item.veterinarianId === data.veterinarianId && item.scheduledAt.getTime() === new Date(data.scheduledAt).getTime())) {
            throw { code: 'P2002' };
          }
          const appointment = { id: appointments.length + 1, ...data };
          appointments.push({ veterinarianId: data.veterinarianId, scheduledAt: new Date(data.scheduledAt) });
          return appointment;
        }),
      },
    };
    const prisma = { ...transaction, $transaction: jest.fn((callback: (client: typeof transaction) => unknown) => callback(transaction)) };
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
    await app.init();
    const jwt = app.get(JwtService);
    ownerToken = await jwt.signAsync({ sub: 10, email: 'owner@example.test', role: 'OWNER' });
    otherOwnerToken = await jwt.signAsync({ sub: 11, email: 'other-owner@example.test', role: 'OWNER' });
    staffToken = await jwt.signAsync({ sub: 12, email: 'staff@example.test', role: 'RECEPTIONIST' });
  });

  afterAll(async () => app?.close());

  const asOwner = (builder: request.Test) => builder.set('Authorization', `Bearer ${ownerToken}`);
  const asOtherOwner = (builder: request.Test) => builder.set('Authorization', `Bearer ${otherOwnerToken}`);
  const asStaff = (builder: request.Test) => builder.set('Authorization', `Bearer ${staffToken}`);
  const payload = (overrides = {}) => ({ petId: 1, scheduledAt: '2031-05-06T10:00:00.000Z', reason: 'Annual examination', ...overrides });

  it('enforces authentication and role boundaries', async () => {
    await request(app.getHttpServer()).post('/appointment-requests').send(payload()).expect(401);
    await asStaff(request(app.getHttpServer()).post('/appointment-requests')).send(payload()).expect(403);
    await asOwner(request(app.getHttpServer()).get('/appointment-requests/staff')).expect(403);
  });

  it('creates and reads only the authenticated owner’s pet requests', async () => {
    const created = await asOwner(request(app.getHttpServer()).post('/appointment-requests')).send(payload()).expect(201);
    expect(created.body).toMatchObject({ id: 1, ownerId: 1, petId: 1, resolutionState: 'PENDING' });
    await asOwner(request(app.getHttpServer()).post('/appointment-requests')).send(payload({ petId: 2 })).expect(404);
    await asOtherOwner(request(app.getHttpServer()).get('/appointment-requests')).expect(200).expect([]);
    const staffList = await asStaff(request(app.getHttpServer()).get('/appointment-requests/staff')).expect(200);
    expect(staffList.body).toEqual([expect.objectContaining({ id: 1 })]);
  });

  it('accepts a pending request atomically and maps scheduling conflicts', async () => {
    const accepted = await asStaff(request(app.getHttpServer()).post('/appointment-requests/1/accept')).send({ veterinarianId: 3 }).expect(200);
    expect(accepted.body).toMatchObject({ resolutionState: 'ACCEPTED', resolvedAppointmentId: 1 });
    await asStaff(request(app.getHttpServer()).post('/appointment-requests/1/accept')).send({ veterinarianId: 3 }).expect(409);
    const conflicting = await asOwner(request(app.getHttpServer()).post('/appointment-requests')).send(payload()).expect(201);
    await asStaff(request(app.getHttpServer()).post(`/appointment-requests/${conflicting.body.id}/accept`)).send({ veterinarianId: 3 }).expect(409);
  });

  it('rejects only pending requests with a validated reason', async () => {
    const pending = await asOwner(request(app.getHttpServer()).post('/appointment-requests')).send(payload({ scheduledAt: '2031-05-06T11:00:00.000Z' })).expect(201);
    await asStaff(request(app.getHttpServer()).post(`/appointment-requests/${pending.body.id}/reject`)).send({}).expect(400);
    const rejected = await asStaff(request(app.getHttpServer()).post(`/appointment-requests/${pending.body.id}/reject`)).send({ rejectionReason: 'No availability.' }).expect(200);
    expect(rejected.body).toMatchObject({ resolutionState: 'REJECTED', rejectionReason: 'No availability.' });
    await asStaff(request(app.getHttpServer()).post(`/appointment-requests/${pending.body.id}/reject`)).send({ rejectionReason: 'Duplicate.' }).expect(409);
  });
});
