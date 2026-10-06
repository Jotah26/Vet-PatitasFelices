import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as argon2 from 'argon2';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Authentication and authorization', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const administratorHash = await argon2.hash('AdministratorPass123!');
    const veterinarianHash = await argon2.hash('VeterinarianPass123!');
    const legacyUserHash =
      '$argon2id$v=19$m=65536,p=4,t=3$RZ99e4V6pojbFbjOKCif7Q$8l1eAFqbMU75MzI9vawLMjRy+kkEmsEspIGhAgfrJd0';
    const prisma = {
      user: {
        findUnique: jest.fn(({ where: { email } }: { where: { email: string } }) => {
          if (email === 'admin@example.test') {
            return {
              id: 1,
              email,
              name: 'Administrator',
              passwordHash: administratorHash,
              status: 'ACTIVE',
              role: { key: 'ADMINISTRATOR' },
            };
          }

          if (email === 'vet@example.test') {
            return {
              id: 2,
              email,
              name: 'Veterinarian',
              passwordHash: veterinarianHash,
              status: 'ACTIVE',
              role: { key: 'VETERINARIAN' },
            };
          }

          if (email === 'legacy@example.test') {
            return {
              id: 3,
              email,
              name: 'Legacy user',
              passwordHash: legacyUserHash,
              status: 'ACTIVE',
              role: { key: 'RECEPTIONIST' },
            };
          }

          return null;
        }),
      },
    };

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('issues an access token only for valid credentials', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@example.test', password: 'AdministratorPass123!' })
      .expect(201)
      .expect(({ body }) => {
        expect(body.accessToken).toEqual(expect.any(String));
        expect(body.user).toEqual({
          id: 1,
          email: 'admin@example.test',
          name: 'Administrator',
          role: 'ADMINISTRATOR',
        });
      });

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@example.test', password: 'wrong-password' })
      .expect(401);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'legacy@example.test', password: 'not-a-legacy-password' })
      .expect(401);
  });

  it('rejects unauthenticated and unauthorized access to an administrator endpoint', async () => {
    await request(app.getHttpServer()).get('/auth/admin').expect(401);

    const veterinarianLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'vet@example.test', password: 'VeterinarianPass123!' })
      .expect(201);

    await request(app.getHttpServer())
      .get('/auth/admin')
      .set('Authorization', `Bearer ${veterinarianLogin.body.accessToken}`)
      .expect(403);
  });
});
