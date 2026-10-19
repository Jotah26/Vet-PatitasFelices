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
    const pets = new Map([[1, { id: 1, ownerId: 1 }], [2, { id: 2, ownerId: 2 }]]);
    const transaction = {
      pet: { findUnique: jest.fn(({ where }: { where: { id: number } }) => pets.get(where.id) ?? null) },
      owner: {
        findUnique: jest.fn(({ where }: { where: { userId: number } }) => where.userId === 10 ? { id: 1 } : null),
      },
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
          findMany: jest.fn(({ where }: { where?: { petId?: number; pet?: { ownerId: number } } } = {}) =>
          [...consultations.values()].filter((item) =>
            (where?.petId === undefined || item.petId === where.petId) &&
            (where?.pet?.ownerId === undefined || pets.get(item.petId as number)?.ownerId === where.pet.ownerId),
          ),
        ),
        findUnique: jest.fn(({ where }: { where: { id: number } }) => consultations.get(where.id) ?? null),
        create: jest.fn(({ data }: { data: MockCreateData }) => {
          const item = { id: nextConsultationId++, status: 'COMPLETED', ...data };
          consultations.set(item.id, item);
          return item;
        }),
      },
      vaccine: {
        findMany: jest.fn(({ where }: { where?: { petId?: number; pet?: { ownerId: number } } } = {}) =>
          [...vaccines.values()].filter((item) =>
            (where?.petId === undefined || item.petId === where.petId) &&
            (where?.pet?.ownerId === undefined || item.ownerId === where.pet.ownerId),
          ),
        ),
        findUnique: jest.fn(({ where }: { where: { id: number } }) => vaccines.get(where.id) ?? null),
        create: jest.fn(({ data }: { data: MockCreateData }) => {
          const item = { id: nextVaccineId++, ...data };
          vaccines.set(item.id, item);
          return item;
        }),
        delete: jest.fn(({ where }: { where: { id: number } }) => {
          const item = vaccines.get(where.id);
          if (!item) throw { code: 'P2025' };
          vaccines.delete(where.id);
          return item;
        }),
      },
      prescription: {
        findMany: jest.fn(({ where }: { where?: { petId?: number; pet?: { ownerId: number } } } = {}) =>
          [...prescriptions.values()].filter((item) =>
            (where?.petId === undefined || item.petId === where.petId) &&
            (where?.pet?.ownerId === undefined || pets.get(item.petId as number)?.ownerId === where.pet.ownerId),
          ),
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

  it('isolates owner vaccine reads and restricts vaccine writes to staff', async () => {
    vaccines.set(20, { id: 20, petId: 1, ownerId: 1, name: 'Rabies' });
    vaccines.set(21, { id: 21, petId: 2, ownerId: 2, name: 'Distemper' });
    await asOwner(request(app.getHttpServer()).get('/vaccines')).expect(403);
    await asOwner(request(app.getHttpServer()).get('/vaccines/mine')).expect(200).then((response) => {
      expect(response.body).toEqual([expect.objectContaining({ id: 20 })]);
      expect(response.body).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: 21 })]));
    });
    await asOwner(request(app.getHttpServer()).post('/vaccines')).send({ petId: 1, name: 'Flu' }).expect(403);
    await asStaff(request(app.getHttpServer()).delete('/vaccines/20')).expect(200);
  });

  it('isolates owner consultation reads and keeps consultation collection staff-only', async () => {
    consultations.set(40, { id: 40, petId: 1, diagnosis: 'Owner pet' });
    consultations.set(41, { id: 41, petId: 2, diagnosis: 'Other owner pet' });
    await asOwner(request(app.getHttpServer()).get('/consultations')).expect(403);
    await asOwner(request(app.getHttpServer()).get('/consultations?petId=2')).expect(403);
    await asOwner(request(app.getHttpServer()).get('/consultations/mine')).expect(200).then((response) => {
      expect(response.body).toEqual(expect.arrayContaining([expect.objectContaining({ id: 40 })]));
      expect(response.body).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: 41 })]));
    });
  });

  it('isolates owner prescription reads and keeps prescription writes staff-only', async () => {
    prescriptions.set(30, { id: 30, petId: 1, veterinarianId: 3, items: [{ medication: 'Vitamin', dose: '1 tablet', days: 7 }] });
    prescriptions.set(31, { id: 31, petId: 2, veterinarianId: 3, items: [] });
    await asOwner(request(app.getHttpServer()).get('/prescriptions')).expect(403);
    await asOwner(request(app.getHttpServer()).get('/prescriptions/mine')).expect(200).then((response) => {
      expect(response.body).toEqual(expect.arrayContaining([expect.objectContaining({ id: 30 })]));
      expect(response.body).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: 31 })]));
    });
    await asOwner(request(app.getHttpServer()).post('/prescriptions')).send({ petId: 1 }).expect(403);
  });
});
