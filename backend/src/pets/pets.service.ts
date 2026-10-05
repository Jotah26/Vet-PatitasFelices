import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';

@Injectable()
export class PetsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreatePetDto) {
    await this.requireOwner(data.ownerId);
    try {
      return await this.prisma.pet.create({ data });
    } catch (error: unknown) {
      return this.translateError(error);
    }
  }

  findAll() {
    return this.prisma.pet.findMany();
  }

  async findOne(id: number) {
    const pet = await this.prisma.pet.findUnique({ where: { id } });
    if (!pet) {
      throw new NotFoundException('Pet not found.');
    }
    return pet;
  }

  async update(id: number, data: UpdatePetDto) {
    if (data.ownerId !== undefined) {
      await this.requireOwner(data.ownerId);
    }
    try {
      return await this.prisma.pet.update({ where: { id }, data });
    } catch (error: unknown) {
      return this.translateError(error);
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.pet.delete({ where: { id } });
    } catch (error: unknown) {
      return this.translateError(error);
    }
  }

  private async requireOwner(id: number): Promise<void> {
    const owner = await this.prisma.owner.findUnique({ where: { id } });
    if (!owner) {
      throw new NotFoundException('Owner not found.');
    }
  }

  private translateError(error: unknown): never {
    const code = this.prismaErrorCode(error);
    if (code === 'P2003' || code === 'P2002') {
      throw new ConflictException('Pet conflicts with existing data.');
    }
    if (code === 'P2025') {
      throw new NotFoundException('Pet not found.');
    }
    throw error;
  }

  private prismaErrorCode(error: unknown): string | undefined {
    return typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string'
      ? error.code
      : undefined;
  }
}
