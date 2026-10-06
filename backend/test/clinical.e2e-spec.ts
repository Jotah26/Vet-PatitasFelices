import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

type MockRecord = Record<string, unknown>;
type MockCreateData = { items?: { create?: MockRecord[] }; [key: string]: unknown };

describe('Clinical care vertical', () => {
  let app: INestApplication;
  let staffToken: string;
  let ownerToken: string;
  const consultations = new Map<number, MockRecord>();
  const vaccines = new Map<number, MockRecord>();
  const prescriptions = new Map<number, MockRecord>();
  let nextConsultationId = 1;
  let nextVaccineId = 1;
  let nextPrescriptionId = 1;

  beforeAll(async () => {
    const pets = new Map([[1, { id: 1, ownerId: 1 }]]);
    const transaction = {
      pet: { findUnique: jest.fn(({ where }: { where: { id: number } }) => pets.get(where.id) ?? null) },
      user: {
        findUnique: jest.fn(({ where }: { where: { id: number } }) =>
          where.id === 3
            ? { id: 3, status: 'ACTIVE', role: { key: 'VETERINARIAN' } }
            : where.id === 9
              ? { id: 9, status: 'INACTIVE', role: { key: 'VETERINARIAN' } }
              : null,
        ),
      },
      consultation: {
        findMany: jest.fn(({ where }: { where?: { petId?: number } } = {}) =>
          [...consultations.values()].filter((item) => where?.petId === undefined || item.petId === where.petId),
        ),
        findUnique: jest.fn(({ where }: { where: { id: number } }) => consultations.get(where.id) ?? null),
        create: jest.fn(({ data }: { data: MockCreateData }) => {
          const item = { id: nextConsultationId++, status: 'COMPLETED', ...data };
          consultations.set(item.id, item);
          return item;
        }),
      },
      vaccine: {
        findMany: jest.fn(({ where }: { where?: { petId?: number } } = {}) =>
          [...vaccines.values()].filter((item) => where?.petId === undefined || item.petId === where.petId),
        ),
        findUnique: jest.fn(({ where }: { where: { id: number } }) => vaccines.get(where.id) ?? null),
        create: jest.fn(({ data }: { data: MockCreateData }) => {
          const item = { id: nextVaccineId++, ...data };
          vaccines.set(item.id, item);
          return item;
        }),
      },
      prescription: {
        findMany: jest.fn(({ where }: { where?: { petId?: number } } = {}) =>
          [...prescriptions.values()].filter((item) => where?.petId === undefined || item.petId === where.petId),
        ),
        findUnique: jest.fn(({ where }: { where: { id: number } }) => prescriptions.get(where.id) ?? null),
        create: jest.fn(({ data }: { data: MockCreateData }) => {
          const { items, ...rest } = data;
          const nested = items?.create ?? [];
          const item = {
            id: nextPrescriptionId++,
            status: 'ISSUED',
            ...rest,
            items: nested.map((entry, index: number) => ({ id: index + 1, ...entry })),
          };
          prescriptions.set(item.id, item);
          return item;
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
    staffToken = await jwt.signAsync({ sub: 12, email: 'staff@example.test', role: 'RECEPTIONIST' });
    ownerToken = await jwt.signAsync({ sub: 10, email: 'owner@example.test', role: 'OWNER' });
  });

  afterAll(async () => app?.close());

  const asStaff = (builder: request.Test) => builder.set('Authorization', `Bearer ${staffToken}`);
  const asOwner = (builder: request.Test) => builder.set('Authorization', `Bearer ${ownerToken}`);
  const attention = (overrides = {}) => ({
    petId: 1,
    veterinarianId: 3,
    type: 'GENERAL_CONSULTATION',
    diagnosis: 'Healthy coat',
    treatment: 'No treatment required',
    recommendations: 'Annual checkup',
    vaccines: [{ name: 'Rabies', batch: 'LOT-1' }],
    prescription: { items: [{ medication: 'Vitamin', dose: '1 tablet', days: 7 }] },
    ...overrides,
  });

  it('enforces authentication and role boundaries', async () => {
    await request(app.getHttpServer()).post('/clinical/attentions').send(attention()).expect(401);
    await asOwner(request(app.getHttpServer()).post('/clinical/attentions')).send(attention()).expect(403);
    await asOwner(request(app.getHttpServer()).get('/consultations')).expect(403);
  });

  it('registers an attention atomically with consultation, vaccines, and prescription', async () => {
    const created = await asStaff(request(app.getHttpServer()).post('/clinical/attentions')).send(attention()).expect(201);
    expect(created.body).toMatchObject({ id: 1, petId: 1, veterinarianId: 3 });
    const listed = await asStaff(request(app.getHttpServer()).get('/consultations?petId=1')).expect(200);
    expect(listed.body).toEqual([expect.objectContaining({ id: 1 })]);
    const listedVaccines = await asStaff(request(app.getHttpServer()).get('/vaccines?petId=1')).expect(200);
    expect(listedVaccines.body).toEqual([expect.objectContaining({ petId: 1, name: 'Rabies' })]);
    const listedPrescriptions = await asStaff(request(app.getHttpServer()).get('/prescriptions?petId=1')).expect(200);
    expect(listedPrescriptions.body).toEqual([expect.objectContaining({ petId: 1 })]);
  });

  it('validates pet existence and active veterinarian', async () => {
    await asStaff(request(app.getHttpServer()).post('/clinical/attentions')).send(attention({ petId: 99 })).expect(404);
    await asStaff(request(app.getHttpServer()).post('/clinical/attentions')).send(attention({ veterinarianId: 9 })).expect(400);
    await asStaff(request(app.getHttpServer()).post('/clinical/attentions')).send(attention({ veterinarianId: 99 })).expect(400);
  });
});
