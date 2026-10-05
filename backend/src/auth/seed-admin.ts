import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { RoleKey } from '../generated/prisma/client';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordService } from './password.service';

function requiredEnvironment(name: 'ADMIN_EMAIL' | 'ADMIN_NAME' | 'ADMIN_PASSWORD'): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required to seed the first administrator.`);
  }
  return value;
}

async function seedAdministrator(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const prisma = app.get(PrismaService);
    const password = app.get(PasswordService);
    const existingAdministrator = await prisma.user.findFirst({
      where: { role: { key: RoleKey.ADMINISTRATOR } },
    });
    if (existingAdministrator) {
      return;
    }

    const email = requiredEnvironment('ADMIN_EMAIL').toLowerCase();
    const name = requiredEnvironment('ADMIN_NAME');
    const plainPassword = requiredEnvironment('ADMIN_PASSWORD');
    await prisma.user.create({
      data: {
        email,
        name,
        passwordHash: await password.hash(plainPassword),
        role: {
          connectOrCreate: {
            where: { key: RoleKey.ADMINISTRATOR },
            create: { key: RoleKey.ADMINISTRATOR },
          },
        },
      },
    });
  } finally {
    await app.close();
  }
}

void seedAdministrator();
