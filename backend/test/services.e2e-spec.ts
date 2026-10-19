import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Service catalog authorization and CRUD', () => {
  type ServiceRecord = { id: number; concept: string; description: string; price: number; durationMinutes: number; active: boolean };
  let app: INestApplication;
  let staffToken: string;
  let ownerToken: string;
  const services = new Map<number, ServiceRecord>();
  let nextId = 1;

  beforeAll(async () => {
    const prisma = {
      service: {
        findMany: jest.fn(() => [...services.values()]),
        findUnique: jest.fn(({ where }: { where: { id: number } }) => services.get(where.id) ?? null),
        create: jest.fn(({ data }: { data: Omit<ServiceRecord, 'id'> }) => {
          const service = { id: nextId++, ...data };
          services.set(service.id, service);
          return service;
        }),
        update: jest.fn(({ where, data }: { where: { id: number }; data: Partial<ServiceRecord> }) => {
          const current = services.get(where.id);
          if (!current) throw { code: 'P2025' };
          const updated = { ...current, ...data };
          services.set(updated.id, updated);
          return updated;
        }),
        delete: jest.fn(({ where }: { where: { id: number } }) => {
          if (!services.delete(where.id)) throw { code: 'P2025' };
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

  it('lets owners read the catalog but not mutate it', async () => {
    await request(app.getHttpServer()).get('/services').set('Authorization', `Bearer ${ownerToken}`).expect(200);
    await request(app.getHttpServer()).post('/services').set('Authorization', `Bearer ${ownerToken}`).send({
      concept: 'Consulta', description: 'General', price: 50, durationMinutes: 30,
    }).expect(403);
  });

  it('lets staff create, update, and delete services', async () => {
    const created = await request(app.getHttpServer()).post('/services').set('Authorization', `Bearer ${staffToken}`).send({
      concept: 'Consulta', description: 'General', price: 50, durationMinutes: 30,
    }).expect(201);
    expect(created.body).toMatchObject({ id: 1, concept: 'Consulta', price: 50 });
    await request(app.getHttpServer()).patch('/services/1').set('Authorization', `Bearer ${staffToken}`).send({ price: 60 }).expect(200);
    await request(app.getHttpServer()).delete('/services/1').set('Authorization', `Bearer ${staffToken}`).expect(204);
    expect(services.size).toBe(0);
  });
});
