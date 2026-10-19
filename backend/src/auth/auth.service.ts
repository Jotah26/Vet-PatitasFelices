import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RoleKey, UserStatus } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { PasswordService } from './password.service';
import { RegisterOwnerDto } from './dto/register-owner.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly password: PasswordService,
    private readonly jwt: JwtService,
  ) {}

  async login(credentials: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: credentials.email.trim().toLowerCase() },
      include: { role: true, owner: true },
    });
    if (!user || user.status !== UserStatus.ACTIVE || !(await this.password.verify(user.passwordHash, credentials.password))) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const role = user.role.key;
    return {
      accessToken: await this.jwt.signAsync({ sub: user.id, email: user.email, role }),
        user: this.publicUser(user, role),
    };
  }

  async currentUser(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { role: true, owner: true } });
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Invalid session.');
    }
    return this.publicUser(user, user.role.key);
  }

  async registerOwner(data: RegisterOwnerDto) {
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const role = await tx.role.upsert({
          where: { key: RoleKey.OWNER },
          update: {},
          create: { key: RoleKey.OWNER },
        });
        const user = await tx.user.create({
          data: {
            name: data.name.trim(),
            email: data.email.trim().toLowerCase(),
            passwordHash: await this.password.hash(data.password),
            roleId: role.id,
          },
        });
        const owner = await tx.owner.create({
          data: {
            name: data.name.trim(),
            documentNumber: data.documentNumber.trim(),
            phone: data.phone.trim(),
            email: data.email.trim().toLowerCase(),
            address: data.address.trim(),
            userId: user.id,
          },
        });
        return { user, owner, role: role.key };
      });
      return {
        accessToken: await this.jwt.signAsync({ sub: result.user.id, email: result.user.email, role: result.role }),
        user: { id: result.user.id, email: result.user.email, name: result.user.name, role: result.role, ownerId: result.owner.id },
      };
    } catch (error: unknown) {
      const code = typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string' ? error.code : undefined;
      if (code === 'P2002') throw new ConflictException('A user with that email or document already exists.');
      throw error;
    }
  }

  private publicUser(user: { id: number; email: string; name: string; owner?: { id: number } | null }, role: RoleKey) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role,
      ...(user.owner ? { ownerId: user.owner.id } : {}),
    };
  }
}
