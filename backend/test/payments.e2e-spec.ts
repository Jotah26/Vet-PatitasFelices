import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

type MockRecord = Record<string, unknown>;

describe('Payments vertical', () => {
  let app: INestApplication;
  let staffToken: string;
  let ownerToken: string;
  const payments = new Map<number, MockRecord>();
  let nextId = 1;

  beforeAll(async () => {
    const appointments = new Map([[1, { id: 1, petId: 1 }]]);
    const prisma = {
      appointment: {
        findUnique: jest.fn(({ where }: { where: { id: number } }) => appointments.get(where.id) ?? null),
      },
      payment: {
        findMany: jest.fn(({ where }: { where?: { status?: string; appointmentId?: number } } = {}) =>
          [...payments.values()].filter((item) =>
            (where?.status === undefined || item.status === where.status) &&
            (where?.appointmentId === undefined || item.appointmentId === where.appointmentId),
          ),
        ),
        findUnique: jest.fn(({ where }: { where: { id: number } }) => payments.get(where.id) ?? null),
        create: jest.fn(({ data }: { data: MockRecord }) => {
          const item = { id: nextId++, status: 'ACTIVE', ...data };
          if (item.status === undefined) item.status = 'ACTIVE';
          payments.set(item.id as number, item);
          return item;
        }),
        update: jest.fn(({ where, data }: { where: { id: number }; data: MockRecord }) => {
          const item = payments.get(where.id);
          if (!item) throw { code: 'P2025' };
          const updated = { ...item, ...data };
          payments.set(where.id, updated);
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
    staffToken = await jwt.signAsync({ sub: 12, email: 'staff@example.test', role: 'RECEPTIONIST' });
    ownerToken = await jwt.signAsync({ sub: 10, email: 'owner@example.test', role: 'OWNER' });
  });

  afterAll(async () => app?.close());

  const asStaff = (builder: request.Test) => builder.set('Authorization', `Bearer ${staffToken}`);
  const asOwner = (builder: request.Test) => builder.set('Authorization', `Bearer ${ownerToken}`);
  const payload = (overrides = {}) => ({ appointmentId: 1, method: 'CASH', amount: 50, ...overrides });

  it('enforces authentication and role boundaries', async () => {
    await request(app.getHttpServer()).post('/payments').send(payload()).expect(401);
    await asOwner(request(app.getHttpServer()).post('/payments')).send(payload()).expect(403);
    await asOwner(request(app.getHttpServer()).get('/payments')).expect(403);
  });

  it('registers, lists, and voids payments with validated amounts and methods', async () => {
    const created = await asStaff(request(app.getHttpServer()).post('/payments')).send(payload()).expect(201);
    expect(created.body).toMatchObject({ id: 1, appointmentId: 1, method: 'CASH', amount: 50, status: 'ACTIVE' });
    const listed = await asStaff(request(app.getHttpServer()).get('/payments')).expect(200);
    expect(listed.body).toEqual([expect.objectContaining({ id: 1 })]);
    const voided = await asStaff(request(app.getHttpServer()).post('/payments/1/void')).expect(200);
    expect(voided.body).toMatchObject({ id: 1, status: 'VOIDED' });
    await asStaff(request(app.getHttpServer()).post('/payments/1/void')).expect(409);
  });

  it('rejects invalid payment data and unknown appointments', async () => {
    await asStaff(request(app.getHttpServer()).post('/payments')).send(payload({ amount: 0 })).expect(400);
    await asStaff(request(app.getHttpServer()).post('/payments')).send(payload({ method: 'BITCOIN' })).expect(400);
    await asStaff(request(app.getHttpServer()).post('/payments')).send(payload({ appointmentId: 99 })).expect(404);
    await asStaff(request(app.getHttpServer()).post('/payments/99/void')).expect(404);
  });
});
