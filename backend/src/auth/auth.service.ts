import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserStatus } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { PasswordService } from './password.service';

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
      include: { role: true },
    });
    if (!user || user.status !== UserStatus.ACTIVE || !(await this.password.verify(user.passwordHash, credentials.password))) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const role = user.role.key;
    return {
      accessToken: await this.jwt.signAsync({ sub: user.id, email: user.email, role }),
      user: { id: user.id, email: user.email, name: user.name, role },
    };
  }
}
