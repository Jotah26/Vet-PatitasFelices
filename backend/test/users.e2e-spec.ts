import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as argon2 from 'argon2';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Internal user administration', () => {
  let app: INestApplication;
  const users = [
    { id: 1, name: 'Administrator', email: 'admin@example.test', passwordHash: '', status: 'ACTIVE', role: { key: 'ADMINISTRATOR' } },
    { id: 2, name: 'Owner', email: 'owner@example.test', passwordHash: '', status: 'ACTIVE', role: { key: 'OWNER' } },
  ];

  beforeAll(async () => {
    users[0].passwordHash = await argon2.hash('AdministratorPass123!');
    users[1].passwordHash = await argon2.hash('OwnerPass123456!');
    const prisma = {
      user: {
        findUnique: jest.fn(({ where: { email } }: { where: { email: string } }) => users.find((user) => user.email === email) ?? null),
        findMany: jest.fn(() => users.filter((user) => user.role.key !== 'OWNER')),
        findFirst: jest.fn(({ where: { id } }: { where: { id: number } }) => users.find((user) => user.id === id) ?? null),
        create: jest.fn(({ data }: { data: { name: string; email: string; passwordHash: string; role: { connectOrCreate: { where: { key: string } } } } }) => ({ id: 3, name: data.name, email: data.email, passwordHash: data.passwordHash, status: 'ACTIVE', role: { key: data.role.connectOrCreate.where.key } })),
        update: jest.fn(({ where, data }: { where: { id: number }; data: { status?: string } }) => ({ ...users.find((user) => user.id === where.id), ...data })),
      },
    };
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(PrismaService).useValue(prisma).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
    await app.init();
  });

  afterAll(() => app.close());

  it('allows only administrators and never exposes password hashes', async () => {
    const admin = await request(app.getHttpServer()).post('/auth/login').send({ email: 'admin@example.test', password: 'AdministratorPass123!' }).expect(201);
    const owner = await request(app.getHttpServer()).post('/auth/login').send({ email: 'owner@example.test', password: 'OwnerPass123456!' }).expect(201);
    await request(app.getHttpServer()).get('/users').set('Authorization', `Bearer ${owner.body.accessToken}`).expect(403);
    await request(app.getHttpServer()).get('/users').set('Authorization', `Bearer ${admin.body.accessToken}`).expect(200).expect(({ body }) => expect(body[0]).not.toHaveProperty('passwordHash'));
  });

  it('requires a strong initial password, rejects OWNER, and protects the current administrator', async () => {
    const admin = await request(app.getHttpServer()).post('/auth/login').send({ email: 'admin@example.test', password: 'AdministratorPass123!' }).expect(201);
    const auth = { Authorization: `Bearer ${admin.body.accessToken}` };
    await request(app.getHttpServer()).post('/users').set(auth).send({ name: 'Short', email: 'short@example.test', password: 'short', role: 'ASSISTANT' }).expect(400);
    await request(app.getHttpServer()).post('/users').set(auth).send({ name: 'Owner', email: 'new-owner@example.test', password: 'ValidPassword123!', role: 'OWNER' }).expect(403);
    await request(app.getHttpServer()).patch('/users/1').set(auth).send({ status: 'INACTIVE' }).expect(403);
  });
});
