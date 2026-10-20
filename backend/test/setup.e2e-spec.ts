import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { PasswordService } from '../src/auth/password.service';

describe('Initial administrator setup', () => {
  const setupToken = 'installation-token-for-tests';
  let app: INestApplication;
  let prisma: { user: { findFirst: jest.Mock }; $transaction: jest.Mock };
  let password: { hash: jest.Mock };

  beforeEach(async () => {
    process.env.INITIAL_ADMIN_SETUP_TOKEN = setupToken;
    prisma = {
      user: { findFirst: jest.fn().mockResolvedValue(null) },
      $transaction: jest.fn(async (callback: (tx: unknown) => unknown) => callback({
        role: { upsert: jest.fn().mockResolvedValue({ id: 1, key: 'ADMINISTRATOR' }) },
        user: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({ id: 7, email: 'admin@example.test', name: 'First Admin' }) },
      })),
    };
    password = { hash: jest.fn().mockResolvedValue('argon2-hash-not-a-response') };
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService).useValue(prisma)
      .overrideProvider(PasswordService).useValue(password)
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    delete process.env.INITIAL_ADMIN_SETUP_TOKEN;
  });

  it('rejects a missing installation token', async () => {
    await request(app.getHttpServer()).post('/setup/administrator').send({
      name: 'First Admin', email: 'admin@example.test', password: 'AdministratorPass123!',
    }).expect(401);
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
  });

  it('rejects an invalid installation token without creating a user', async () => {
    await request(app.getHttpServer()).post('/setup/administrator').send({
      name: 'First Admin', email: 'admin@example.test', password: 'AdministratorPass123!', setupToken: 'wrong-token',
    }).expect(401);
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects setup after an administrator already exists', async () => {
    prisma.$transaction.mockImplementationOnce(async (callback: (tx: unknown) => unknown) => callback({
      user: { findFirst: jest.fn().mockResolvedValue({ id: 1 }) },
    }));
    await request(app.getHttpServer()).post('/setup/administrator').send({
      name: 'Second Admin', email: 'second@example.test', password: 'AdministratorPass123!', setupToken,
    }).expect(409);
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('creates the first administrator and returns a public session', async () => {
    await request(app.getHttpServer()).post('/setup/administrator').send({
      name: 'First Admin', email: 'admin@example.test', password: 'AdministratorPass123!', setupToken,
    }).expect(201).expect(({ body }) => {
      expect(body.accessToken).toEqual(expect.any(String));
      expect(body.user).toEqual({ id: 7, email: 'admin@example.test', name: 'First Admin', role: 'ADMINISTRATOR' });
      expect(JSON.stringify(body)).not.toContain('argon2-hash-not-a-response');
    });
    expect(password.hash).toHaveBeenCalledWith('AdministratorPass123!');
  });

  it('does not expose the setup token or password in the successful response', async () => {
    await request(app.getHttpServer()).post('/setup/administrator').send({
      name: 'First Admin', email: 'admin@example.test', password: 'AdministratorPass123!', setupToken,
    }).expect(({ body }) => {
      const response = JSON.stringify(body);
      expect(response).not.toContain(setupToken);
      expect(response).not.toContain('AdministratorPass123!');
    });
  });
});
