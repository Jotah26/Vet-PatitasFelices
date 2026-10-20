import { ConflictException, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { timingSafeEqual } from 'node:crypto';
import { RoleKey } from '../generated/prisma/client';
import { PasswordService } from '../auth/password.service';
import { SetupAdministratorDto } from '../auth/dto/setup-administrator.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SetupService {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly password: PasswordService,
    private readonly jwt: JwtService,
  ) {}

  async createAdministrator(data: SetupAdministratorDto) {
    const configuredToken = this.config.get<string>('INITIAL_ADMIN_SETUP_TOKEN')?.trim();
    if (!configuredToken) throw new ServiceUnavailableException('La configuración inicial no está disponible.');
    if (!data.setupToken || !this.matchesToken(data.setupToken, configuredToken)) {
      throw new UnauthorizedException('No se pudo completar la configuración inicial.');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const existingAdministrator = await tx.user.findFirst({ where: { role: { key: RoleKey.ADMINISTRATOR } } });
      if (existingAdministrator) throw new ConflictException('La configuración inicial ya fue completada.');
      const role = await tx.role.upsert({
        where: { key: RoleKey.ADMINISTRATOR },
        update: {},
        create: { key: RoleKey.ADMINISTRATOR },
      });
      const user = await tx.user.create({
        data: {
          name: data.name.trim(),
          email: data.email.trim().toLowerCase(),
          passwordHash: await this.password.hash(data.password),
          roleId: role.id,
        },
      });
      return { user, role: role.key };
    }, { isolationLevel: 'Serializable' });

    return {
      accessToken: await this.jwt.signAsync({ sub: result.user.id, email: result.user.email, role: result.role }),
      user: { id: result.user.id, email: result.user.email, name: result.user.name, role: result.role },
    };
  }

  private matchesToken(received: string, expected: string): boolean {
    const receivedBytes = Buffer.from(received);
    const expectedBytes = Buffer.from(expected);
    return receivedBytes.length === expectedBytes.length && timingSafeEqual(receivedBytes, expectedBytes);
  }
}
