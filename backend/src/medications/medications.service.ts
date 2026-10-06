import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMedicationDto } from './dto/create-medication.dto';
import { UpdateMedicationDto } from './dto/update-medication.dto';

@Injectable()
export class MedicationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateMedicationDto) {
    try {
      return await this.prisma.medication.create({ data });
    } catch (error: unknown) {
      throw this.translateError(error);
    }
  }

  findAll() {
    return this.prisma.medication.findMany();
  }

  async findOne(id: number) {
    const medication = await this.prisma.medication.findUnique({ where: { id } });
    if (!medication) {
      throw new NotFoundException('Medication not found.');
    }
    return medication;
  }

  async update(id: number, data: UpdateMedicationDto) {
    try {
      return await this.prisma.medication.update({ where: { id }, data });
    } catch (error: unknown) {
      throw this.translateError(error);
    }
  }

  async remove(id: number) {
    try {
      await this.prisma.medication.delete({ where: { id } });
    } catch (error: unknown) {
      throw this.translateError(error);
    }
  }

  async restock(id: number, quantity: number) {
    try {
      return await this.prisma.medication.update({
        where: { id },
        data: { stock: { increment: quantity } },
      });
    } catch (error: unknown) {
      throw this.translateError(error);
    }
  }

  async dispense(id: number, quantity: number) {
    const claimed = await this.prisma.medication.updateMany({
      where: { id, stock: { gte: quantity } },
      data: { stock: { decrement: quantity } },
    });
    if (claimed.count === 0) {
      await this.findOne(id);
      throw new ConflictException('Insufficient stock.');
    }
    return this.findOne(id);
  }

  private translateError(error: unknown): Error {
    const code = this.prismaErrorCode(error);
    if (code === 'P2002' || code === 'P2003') {
      return new ConflictException('Medication conflicts with existing data.');
    }
    if (code === 'P2025') {
      return new NotFoundException('Medication not found.');
    }
    throw error;
  }

  private prismaErrorCode(error: unknown): string | undefined {
    return typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string'
      ? error.code
      : undefined;
  }
}
