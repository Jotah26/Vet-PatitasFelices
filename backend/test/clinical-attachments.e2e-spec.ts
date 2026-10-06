import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

type MockRecord = Record<string, unknown>;

describe('Private consultation attachments', () => {
  let app: INestApplication;
  let staffToken: string;
  let ownerToken: string;
  const attachments = new Map<number, MockRecord>();
  let nextId = 1;

  beforeAll(async () => {
    const consultations = new Map([[1, { id: 1, petId: 1, veterinarianId: 3 }]]);
    const transaction = {
      consultation: {
        findUnique: jest.fn(({ where }: { where: { id: number } }) => consultations.get(where.id) ?? null),
      },
      clinicalAttachment: {
        findMany: jest.fn(({ where }: { where: { consultationId: number } }) =>
          [...attachments.values()].filter((item) => item.consultationId === where.consultationId),
        ),
        findUnique: jest.fn(({ where }: { where: { id: number } }) => attachments.get(where.id) ?? null),
        create: jest.fn(({ data }: { data: MockRecord }) => {
          const item = { id: nextId++, ...data };
          attachments.set(item.id as number, item);
          return item;
        }),
        delete: jest.fn(({ where }: { where: { id: number } }) => {
          const item = attachments.get(where.id);
          if (!item) throw { code: 'P2025' };
          attachments.delete(where.id);
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
  const payload = (overrides = {}) => ({
    fileName: 'radiograph.png',
    mimeType: 'image/png',
    dataUrl: 'data:image/png;base64,iVBORw0KGgo=',
    ...overrides,
  });

  it('enforces authentication and role boundaries', async () => {
    await request(app.getHttpServer()).post('/consultations/1/attachments').send(payload()).expect(401);
    await asOwner(request(app.getHttpServer()).post('/consultations/1/attachments')).send(payload()).expect(403);
    await asOwner(request(app.getHttpServer()).get('/consultations/1/attachments')).expect(403);
    await asOwner(request(app.getHttpServer()).get('/attachments/1')).expect(403);
  });

  it('uploads, lists, reads, and deletes through the owning consultation', async () => {
    const created = await asStaff(request(app.getHttpServer()).post('/consultations/1/attachments'))
      .send(payload())
      .expect(201);
    expect(created.body).toMatchObject({ id: 1, consultationId: 1, fileName: 'radiograph.png' });
    const listed = await asStaff(request(app.getHttpServer()).get('/consultations/1/attachments')).expect(200);
    expect(listed.body).toEqual([expect.objectContaining({ id: 1 })]);
    const read = await asStaff(request(app.getHttpServer()).get('/attachments/1')).expect(200);
    expect(read.body).toMatchObject({ id: 1, dataUrl: 'data:image/png;base64,iVBORw0KGgo=' });
    await asStaff(request(app.getHttpServer()).delete('/attachments/1')).expect(204);
    await asStaff(request(app.getHttpServer()).get('/attachments/1')).expect(404);
  });

  it('rejects unknown consultations and invalid uploads', async () => {
    await asStaff(request(app.getHttpServer()).post('/consultations/99/attachments')).send(payload()).expect(404);
    await asStaff(request(app.getHttpServer()).get('/consultations/99/attachments')).expect(404);
    await asStaff(request(app.getHttpServer()).post('/consultations/1/attachments')).send({ ...payload(), dataUrl: 'nota-data-url' }).expect(400);
    await asStaff(request(app.getHttpServer()).post('/consultations/1/attachments')).send({ ...payload(), mimeType: 'no-es-mime' }).expect(400);
  });
});
