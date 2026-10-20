import { ConflictException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RoleKey } from '../generated/prisma/client';
import { PasswordService } from '../auth/password.service';
import { SetupAdministratorDto } from '../auth/dto/setup-administrator.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SetupService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly password: PasswordService,
    private readonly jwt: JwtService,
  ) {}

  async createAdministrator(data: SetupAdministratorDto) {
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

}
