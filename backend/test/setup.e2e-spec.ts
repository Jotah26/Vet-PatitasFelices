import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { PasswordService } from '../src/auth/password.service';

describe('Initial administrator setup', () => {
  let app: INestApplication;
  let prisma: { user: { findFirst: jest.Mock }; $transaction: jest.Mock };
  let password: { hash: jest.Mock };

  beforeEach(async () => {
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
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('creates the first administrator without an installation token', async () => {
    await request(app.getHttpServer()).post('/setup/administrator').send({
      name: 'First Admin', email: 'admin@example.test', password: 'AdministratorPass123!',
    }).expect(201).expect(({ body }) => {
      expect(body.accessToken).toEqual(expect.any(String));
      expect(body.user).toEqual({ id: 7, email: 'admin@example.test', name: 'First Admin', role: 'ADMINISTRATOR' });
    });
  });

  it('rejects setup after an administrator already exists', async () => {
    prisma.$transaction.mockImplementationOnce(async (callback: (tx: unknown) => unknown) => callback({
      user: { findFirst: jest.fn().mockResolvedValue({ id: 1 }) },
    }));
    await request(app.getHttpServer()).post('/setup/administrator').send({
      name: 'Second Admin', email: 'second@example.test', password: 'AdministratorPass123!',
    }).expect(409);
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('validates required fields and does not create a user', async () => {
    await request(app.getHttpServer()).post('/setup/administrator').send({
      name: '', email: 'not-an-email', password: 'short',
    }).expect(400);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('does not expose the password or password hash in the successful response', async () => {
    await request(app.getHttpServer()).post('/setup/administrator').send({
      name: 'First Admin', email: 'admin@example.test', password: 'AdministratorPass123!',
    }).expect(({ body }) => {
      const response = JSON.stringify(body);
      expect(response).not.toContain('argon2-hash-not-a-response');
      expect(response).not.toContain('AdministratorPass123!');
    });
    expect(password.hash).toHaveBeenCalledWith('AdministratorPass123!');
  });

  it('rate-limits repeated setup attempts', async () => {
    prisma.$transaction.mockImplementation(async (callback: (tx: unknown) => unknown) => callback({
      user: { findFirst: jest.fn().mockResolvedValue({ id: 1 }) },
    }));
    const payload = { name: 'Second Admin', email: 'rate-limit@example.test', password: 'AdministratorPass123!' };
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await request(app.getHttpServer()).post('/setup/administrator').send(payload).expect(409);
    }
    await request(app.getHttpServer()).post('/setup/administrator').send(payload).expect(429).expect((response) => {
      expect(response.headers['retry-after']).toEqual(expect.any(String));
    });
  });
});
