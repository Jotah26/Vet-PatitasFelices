import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateServiceDto) {
    try {
      return await this.prisma.service.create({ data });
    } catch (error: unknown) {
      throw this.translateError(error);
    }
  }

  findAll() {
    return this.prisma.service.findMany();
  }

  async findOne(id: number) {
    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service) {
      throw new NotFoundException('Service not found.');
    }
    return service;
  }

  async update(id: number, data: UpdateServiceDto) {
    try {
      return await this.prisma.service.update({ where: { id }, data });
    } catch (error: unknown) {
      throw this.translateError(error);
    }
  }

  async remove(id: number) {
    try {
      await this.prisma.service.delete({ where: { id } });
    } catch (error: unknown) {
      throw this.translateError(error);
    }
  }

  private translateError(error: unknown): Error {
    const code = this.prismaErrorCode(error);
    if (code === 'P2002' || code === 'P2003') {
      return new ConflictException('Service conflicts with existing data.');
    }
    if (code === 'P2025') {
      return new NotFoundException('Service not found.');
    }
    throw error;
  }

  private prismaErrorCode(error: unknown): string | undefined {
    return typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string'
      ? error.code
      : undefined;
  }
}
