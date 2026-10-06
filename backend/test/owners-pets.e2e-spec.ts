import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

type Owner = {
  id: number;
  name: string;
  documentNumber: string;
  phone: string;
  email: string;
  address: string;
};

type Pet = {
  id: number;
  name: string;
  species: string;
  breed: string;
  sex: string;
  age: string;
  color: string;
  weight: string;
  isNeutered: boolean;
  medicalBackground: string;
  photoDataUrl: string | null;
  ownerId: number;
};

describe('Staff owner and pet CRUD', () => {
  let app: INestApplication;
  let staffToken: string;
  let ownerToken: string;
  const owners = new Map<number, Owner>();
  const pets = new Map<number, Pet>();
  let nextOwnerId = 1;
  let nextPetId = 1;

  const notFound = { code: 'P2025' };
  const conflict = { code: 'P2002' };
  const restricted = { code: 'P2003' };

  beforeAll(async () => {
    const prisma = {
      owner: {
        create: jest.fn(({ data }: { data: Omit<Owner, 'id'> }) => {
          if (
            [...owners.values()].some(
              (owner) => owner.email === data.email || owner.documentNumber === data.documentNumber,
            )
          ) {
            throw conflict;
          }
          const owner = { id: nextOwnerId++, ...data };
          owners.set(owner.id, owner);
          return owner;
        }),
        findMany: jest.fn(() => [...owners.values()]),
        findUnique: jest.fn(({ where }: { where: Partial<Owner> }) =>
          [...owners.values()].find(
            (owner) =>
              (where.id === undefined || owner.id === where.id) &&
              (where.email === undefined || owner.email === where.email) &&
              (where.documentNumber === undefined || owner.documentNumber === where.documentNumber),
          ) ?? null,
        ),
        update: jest.fn(({ where, data }: { where: Pick<Owner, 'id'>; data: Partial<Owner> }) => {
          const owner = owners.get(where.id);
          if (!owner) {
            throw notFound;
          }
          if (
            [...owners.values()].some(
              (candidate) =>
                candidate.id !== owner.id &&
                (candidate.email === data.email || candidate.documentNumber === data.documentNumber),
            )
          ) {
            throw conflict;
          }
          const changes = Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
          const updated = { ...owner, ...changes };
          owners.set(updated.id, updated);
          return updated;
        }),
        delete: jest.fn(({ where }: { where: Pick<Owner, 'id'> }) => {
          if (!owners.has(where.id)) {
            throw notFound;
          }
          if ([...pets.values()].some((pet) => pet.ownerId === where.id)) {
            throw restricted;
          }
          const owner = owners.get(where.id)!;
          owners.delete(where.id);
          return owner;
        }),
      },
      pet: {
        create: jest.fn(({ data }: { data: Omit<Pet, 'id'> }) => {
          const pet = { id: nextPetId++, ...data };
          pets.set(pet.id, pet);
          return pet;
        }),
        findMany: jest.fn(() => [...pets.values()]),
        findUnique: jest.fn(({ where }: { where: Pick<Pet, 'id'> }) => pets.get(where.id) ?? null),
        update: jest.fn(({ where, data }: { where: Pick<Pet, 'id'>; data: Partial<Pet> }) => {
          const pet = pets.get(where.id);
          if (!pet) {
            throw notFound;
          }
          const changes = Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
          const updated = { ...pet, ...changes };
          pets.set(updated.id, updated);
          return updated;
        }),
        delete: jest.fn(({ where }: { where: Pick<Pet, 'id'> }) => {
          const pet = pets.get(where.id);
          if (!pet) {
            throw notFound;
          }
          if (pet.name === 'Protected') {
            throw restricted;
          }
          pets.delete(where.id);
          return pet;
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
    staffToken = await jwt.signAsync({ sub: 1, email: 'staff@example.test', role: 'RECEPTIONIST' });
    ownerToken = await jwt.signAsync({ sub: 2, email: 'owner@example.test', role: 'OWNER' });
  });

  afterAll(async () => {
    await app?.close();
  });

  const staff = (requestBuilder: request.Test) => requestBuilder.set('Authorization', `Bearer ${staffToken}`);

  const ownerPayload = {
    name: 'Ana Owner',
    documentNumber: '12345678',
    phone: '+54 11 5555 1234',
    email: ' ANA@EXAMPLE.TEST ',
    address: 'Main Street 123',
  };

  const petPayload = {
    name: 'Milo',
    species: 'CAT',
    breed: 'Domestic shorthair',
    sex: 'MALE',
    age: '4 years',
    color: 'Black',
    weight: '4.5 kg',
    isNeutered: true,
    medicalBackground: 'None',
  };

  it('requires an authenticated staff role', async () => {
    await request(app.getHttpServer()).get('/owners').expect(401);
    await request(app.getHttpServer()).get('/owners').set('Authorization', `Bearer ${ownerToken}`).expect(403);
  });

  it('validates, normalizes, creates, reads, updates, and protects owner uniqueness', async () => {
    await staff(request(app.getHttpServer()).post('/owners')).send({ ...ownerPayload, unexpected: true }).expect(400);

    const created = await staff(request(app.getHttpServer()).post('/owners')).send(ownerPayload).expect(201);
    expect(created.body).toMatchObject({ id: 1, email: 'ana@example.test' });

    const ownersResponse = await staff(request(app.getHttpServer()).get('/owners')).expect(200);
    expect(ownersResponse.body).toEqual([expect.objectContaining({ id: 1 })]);
    await staff(request(app.getHttpServer()).get('/owners/1')).expect(200).expect({ ...created.body });

    const updated = await staff(request(app.getHttpServer()).patch('/owners/1'))
      .send({ email: ' UPDATED@EXAMPLE.TEST ' })
      .expect(200);
    expect(updated.body).toEqual(expect.objectContaining({ email: 'updated@example.test' }));

    await staff(request(app.getHttpServer()).post('/owners'))
      .send({ ...ownerPayload, email: 'updated@example.test' })
      .expect(409);
    await staff(request(app.getHttpServer()).post('/owners'))
      .send({ ...ownerPayload, email: 'different@example.test' })
      .expect(409);
  });

  it('requires an existing owner and preserves pet ownership integrity', async () => {
    await staff(request(app.getHttpServer()).post('/pets')).send({ ...petPayload, species: 'INVALID', ownerId: 1 }).expect(400);
    await staff(request(app.getHttpServer()).post('/pets')).send({ ...petPayload, ownerId: 999 }).expect(404);

    const created = await staff(request(app.getHttpServer()).post('/pets')).send({ ...petPayload, ownerId: 1 }).expect(201);
    expect(created.body).toMatchObject({ id: 1, ownerId: 1 });

    const petsResponse = await staff(request(app.getHttpServer()).get('/pets')).expect(200);
    expect(petsResponse.body).toEqual([expect.objectContaining({ id: 1 })]);
    await staff(request(app.getHttpServer()).get('/pets/1')).expect(200).expect({ ...created.body });
    await staff(request(app.getHttpServer()).patch('/pets/1')).send({ ownerId: 999 }).expect(404);
  });

  it('translates restrictive deletes into conflicts and deletes independent records', async () => {
    await staff(request(app.getHttpServer()).delete('/owners/1')).expect(409);
    await staff(request(app.getHttpServer()).delete('/pets/1')).expect(204);
    await staff(request(app.getHttpServer()).delete('/owners/1')).expect(204);
    await staff(request(app.getHttpServer()).get('/owners/1')).expect(404);
  });

  it('translates pet deletion restrictions into conflicts', async () => {
    const owner = await staff(request(app.getHttpServer()).post('/owners'))
      .send({ ...ownerPayload, documentNumber: '99999999', email: 'other@example.test' })
      .expect(201);
    const pet = await staff(request(app.getHttpServer()).post('/pets'))
      .send({ ...petPayload, name: 'Protected', ownerId: owner.body.id })
      .expect(201);

    await staff(request(app.getHttpServer()).delete(`/pets/${pet.body.id}`)).expect(409);
  });
});
