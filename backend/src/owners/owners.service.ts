import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOwnerDto } from './dto/create-owner.dto';
import { UpdateOwnerDto } from './dto/update-owner.dto';

@Injectable()
export class OwnersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateOwnerDto) {
    try {
      return await this.prisma.owner.create({ data });
    } catch (error: unknown) {
      return this.translateError(error);
    }
  }

  findAll() {
    return this.prisma.owner.findMany();
  }

  async findOne(id: number) {
    const owner = await this.prisma.owner.findUnique({ where: { id } });
    if (!owner) {
      throw new NotFoundException('Owner not found.');
    }
    return owner;
  }

  async update(id: number, data: UpdateOwnerDto) {
    try {
      return await this.prisma.owner.update({ where: { id }, data });
    } catch (error: unknown) {
      return this.translateError(error);
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.owner.delete({ where: { id } });
    } catch (error: unknown) {
      return this.translateError(error);
    }
  }

  private translateError(error: unknown): never {
    const code = this.prismaErrorCode(error);
    if (code === 'P2002' || code === 'P2003') {
      throw new ConflictException('Owner conflicts with existing data.');
    }
    if (code === 'P2025') {
      throw new NotFoundException('Owner not found.');
    }
    throw error;
  }

  private prismaErrorCode(error: unknown): string | undefined {
    return typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string'
      ? error.code
      : undefined;
  }
}
