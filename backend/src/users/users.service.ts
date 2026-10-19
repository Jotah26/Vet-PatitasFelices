import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { RoleKey, UserStatus } from '../generated/prisma/client';
import { PasswordService } from '../auth/password.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const INTERNAL_ROLES = [RoleKey.ADMINISTRATOR, RoleKey.VETERINARIAN, RoleKey.RECEPTIONIST, RoleKey.ASSISTANT] as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService, private readonly password: PasswordService) {}

  async findAll() {
    const users = await this.prisma.user.findMany({ where: { role: { key: { in: [...INTERNAL_ROLES] } } }, select: { id: true, name: true, email: true, status: true, role: { select: { key: true } } }, orderBy: { name: 'asc' } });
    return users.map((user) => this.publicUser(user));
  }

  async create(data: CreateUserDto) {
    this.assertInternalRole(data.role);
    try {
      const user = await this.prisma.user.create({ data: { name: data.name.trim(), email: data.email.trim().toLowerCase(), passwordHash: await this.password.hash(data.password), role: { connectOrCreate: { where: { key: data.role }, create: { key: data.role } } } }, select: { id: true, name: true, email: true, status: true, role: { select: { key: true } } } });
      return this.publicUser(user);
    } catch (error: unknown) { this.translateError(error); }
  }

  async update(id: number, data: UpdateUserDto, currentUserId: number) {
    await this.findInternal(id);
    if (id === currentUserId && ((data.role !== undefined && data.role !== RoleKey.ADMINISTRATOR) || data.status === UserStatus.INACTIVE)) throw new ForbiddenException('No puede quitarse el acceso de administrador actual.');
    if (data.role !== undefined) this.assertInternalRole(data.role);
    try {
      const user = await this.prisma.user.update({ where: { id }, data: { ...(data.name !== undefined ? { name: data.name.trim() } : {}), ...(data.email !== undefined ? { email: data.email.trim().toLowerCase() } : {}), ...(data.password !== undefined ? { passwordHash: await this.password.hash(data.password) } : {}), ...(data.status !== undefined ? { status: data.status } : {}), ...(data.role !== undefined ? { role: { connect: { key: data.role } } } : {}) }, select: { id: true, name: true, email: true, status: true, role: { select: { key: true } } } });
      return this.publicUser(user);
    } catch (error: unknown) { this.translateError(error); }
  }

  async remove(id: number, currentUserId: number) {
    if (id === currentUserId) throw new ForbiddenException('No puede eliminar su propia cuenta.');
    await this.findInternal(id);
    try {
      const user = await this.prisma.user.update({ where: { id }, data: { status: UserStatus.INACTIVE }, select: { id: true, name: true, email: true, status: true, role: { select: { key: true } } } });
      return this.publicUser(user);
    } catch (error: unknown) { this.translateError(error); }
  }

  private async findInternal(id: number) {
    const user = await this.prisma.user.findFirst({ where: { id, role: { key: { in: [...INTERNAL_ROLES] } } } });
    if (!user) throw new NotFoundException('Internal user not found.');
    return user;
  }

  private assertInternalRole(role: RoleKey): asserts role is Exclude<RoleKey, typeof RoleKey.OWNER> {
    if (!INTERNAL_ROLES.includes(role as (typeof INTERNAL_ROLES)[number])) throw new ForbiddenException('Owner role is not valid for internal users.');
  }

  private publicUser(user: { id: number; name: string; email: string; status: UserStatus; role: { key: RoleKey } }) { return { id: user.id, name: user.name, email: user.email, status: user.status, role: user.role.key }; }

  private translateError(error: unknown): never {
    const code = typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string' ? error.code : undefined;
    if (code === 'P2002') throw new ConflictException('A user with that email already exists.');
    if (code === 'P2025') throw new NotFoundException('Internal user not found.');
    throw error;
  }
}
