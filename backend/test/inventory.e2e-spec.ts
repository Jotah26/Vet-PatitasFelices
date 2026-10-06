import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

type MockRecord = Record<string, unknown>;

describe('Inventory vertical', () => {
  let app: INestApplication;
  let staffToken: string;
  let ownerToken: string;
  const medications = new Map<number, MockRecord>();
  const services = new Map<number, MockRecord>();
  let nextMedicationId = 1;
  let nextServiceId = 1;

  beforeAll(async () => {
    const prisma = {
      medication: {
        findMany: jest.fn(() => [...medications.values()]),
        findUnique: jest.fn(({ where }: { where: { id: number } }) => medications.get(where.id) ?? null),
        create: jest.fn(({ data }: { data: MockRecord }) => {
          const item = { id: nextMedicationId++, ...data };
          medications.set(item.id as number, item);
          return item;
        }),
        update: jest.fn(({ where, data }: { where: { id: number }; data: MockRecord }) => {
          const item = medications.get(where.id);
          if (!item) throw { code: 'P2025' };
          const stock = data.stock as { increment?: number; decrement?: number } | number | undefined;
          const updated = {
            ...item,
            ...data,
            stock:
              typeof stock === 'object' && stock !== null && stock.increment !== undefined
                ? ((item.stock as number) + stock.increment)
                : typeof stock === 'object' && stock !== null && stock.decrement !== undefined
                  ? ((item.stock as number) - stock.decrement)
                  : (data.stock ?? item.stock),
          };
          medications.set(where.id, updated);
          return updated;
        }),
        updateMany: jest.fn(
          ({ where, data }: { where: { id: number; stock?: { gte: number } }; data: MockRecord }) => {
            const item = medications.get(where.id);
            if (!item) return { count: 0 };
            if (where.stock !== undefined && ((item.stock as number) < where.stock.gte)) return { count: 0 };
            const decrement = (data.stock as { decrement?: number }).decrement ?? 0;
            medications.set(where.id, { ...item, stock: (item.stock as number) - decrement });
            return { count: 1 };
          },
        ),
        delete: jest.fn(({ where }: { where: { id: number } }) => {
          const item = medications.get(where.id);
          if (!item) throw { code: 'P2025' };
          medications.delete(where.id);
          return item;
        }),
      },
      service: {
        findMany: jest.fn(() => [...services.values()]),
        findUnique: jest.fn(({ where }: { where: { id: number } }) => services.get(where.id) ?? null),
        create: jest.fn(({ data }: { data: MockRecord }) => {
          const item = { id: nextServiceId++, active: true, ...data };
          // Prisma treats explicit undefined as unset, so the database default applies.
          if (item.active === undefined) item.active = true;
          services.set(item.id as number, item);
          return item;
        }),
        update: jest.fn(({ where, data }: { where: { id: number }; data: MockRecord }) => {
          const item = services.get(where.id);
          if (!item) throw { code: 'P2025' };
          const updated = { ...item, ...data };
          services.set(where.id, updated);
          return updated;
        }),
        delete: jest.fn(({ where }: { where: { id: number } }) => {
          const item = services.get(where.id);
          if (!item) throw { code: 'P2025' };
          services.delete(where.id);
          return item;
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
  const medication = (overrides = {}) => ({
    name: 'Amoxicillin',
    category: 'ANTIBIOTIC',
    presentation: 'Tablets x 20',
    stock: 10,
    minStock: 2,
    price: 15.5,
    ...overrides,
  });
  const service = (overrides = {}) => ({
    concept: 'General consultation',
    description: 'Clinical examination',
    price: 50,
    durationMinutes: 30,
    ...overrides,
  });

  it('enforces authentication and role boundaries', async () => {
    await request(app.getHttpServer()).post('/medications').send(medication()).expect(401);
    await asOwner(request(app.getHttpServer()).post('/medications')).send(medication()).expect(403);
    await asOwner(request(app.getHttpServer()).get('/medications')).expect(403);
    await request(app.getHttpServer()).post('/services').send(service()).expect(401);
    await asOwner(request(app.getHttpServer()).post('/services')).send(service()).expect(403);
    await asOwner(request(app.getHttpServer()).get('/services')).expect(403);
  });

  it('manages the medication catalog with validated stock movements', async () => {
    const created = await asStaff(request(app.getHttpServer()).post('/medications')).send(medication()).expect(201);
    expect(created.body).toMatchObject({ id: 1, name: 'Amoxicillin', stock: 10 });
    await asStaff(request(app.getHttpServer()).post('/medications')).send(medication({ stock: -1 })).expect(400);
    const restocked = await asStaff(request(app.getHttpServer()).post('/medications/1/restock'))
      .send({ quantity: 5 })
      .expect(200);
    expect(restocked.body).toMatchObject({ id: 1, stock: 15 });
    const dispensed = await asStaff(request(app.getHttpServer()).post('/medications/1/dispense'))
      .send({ quantity: 4 })
      .expect(200);
    expect(dispensed.body).toMatchObject({ id: 1, stock: 11 });
    await asStaff(request(app.getHttpServer()).post('/medications/1/dispense')).send({ quantity: 99 }).expect(409);
    await asStaff(request(app.getHttpServer()).post('/medications/99/restock')).send({ quantity: 1 }).expect(404);
    await asStaff(request(app.getHttpServer()).delete('/medications/1')).expect(204);
    await asStaff(request(app.getHttpServer()).get('/medications/1')).expect(404);
  });

  it('manages the tariff catalog with active default', async () => {
    const created = await asStaff(request(app.getHttpServer()).post('/services')).send(service()).expect(201);
    expect(created.body).toMatchObject({ id: 1, concept: 'General consultation', active: true });
    const listed = await asStaff(request(app.getHttpServer()).get('/services')).expect(200);
    expect(listed.body).toEqual([expect.objectContaining({ id: 1 })]);
    const updated = await asStaff(request(app.getHttpServer()).patch('/services/1')).send({ active: false }).expect(200);
    expect(updated.body).toMatchObject({ id: 1, active: false });
    await asStaff(request(app.getHttpServer()).delete('/services/1')).expect(204);
    await asStaff(request(app.getHttpServer()).get('/services/1')).expect(404);
  });
});
