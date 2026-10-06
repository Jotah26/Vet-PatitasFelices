import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AppointmentRequestResolution, RoleKey, UserStatus } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentRequestDto } from './dto/create-appointment-request.dto';

@Injectable()
export class AppointmentRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, data: CreateAppointmentRequestDto) {
    const owner = await this.prisma.owner.findUnique({ where: { userId } });
    if (!owner) {
      throw new NotFoundException('Owner not found.');
    }
    const pet = await this.prisma.pet.findUnique({ where: { id: data.petId } });
    if (!pet || pet.ownerId !== owner.id) {
      throw new NotFoundException('Pet not found.');
    }
    return this.prisma.appointmentRequest.create({
      data: {
        ownerId: owner.id,
        petId: data.petId,
        scheduledAt: data.scheduledAt,
        reason: data.reason,
      },
    });
  }

  async findMine(userId: number) {
    const owner = await this.prisma.owner.findUnique({ where: { userId } });
    if (!owner) {
      return [];
    }
    return this.prisma.appointmentRequest.findMany({ where: { ownerId: owner.id } });
  }

  findAllForStaff() {
    return this.prisma.appointmentRequest.findMany();
  }

  accept(id: number, veterinarianId: number) {
    return this.prisma.$transaction(async (tx) => {
      await this.requireActiveVeterinarian(tx, veterinarianId);
      const existing = await tx.appointmentRequest.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundException('Appointment request not found.');
      }
      if (existing.resolutionState !== AppointmentRequestResolution.PENDING) {
        throw new ConflictException('Appointment request already resolved.');
      }
      let appointment: { id: number };
      try {
        appointment = await tx.appointment.create({
          data: {
            petId: existing.petId,
            veterinarianId,
            scheduledAt: existing.scheduledAt,
            reason: existing.reason,
          },
        });
      } catch (error: unknown) {
        throw this.translateError(error);
      }
      const claimed = await tx.appointmentRequest.updateMany({
        where: { id, resolutionState: AppointmentRequestResolution.PENDING },
        data: {
          resolutionState: AppointmentRequestResolution.ACCEPTED,
          resolvedAppointmentId: appointment.id,
          resolvedAt: new Date(),
        },
      });
      if (claimed.count === 0) {
        throw new ConflictException('Appointment request already resolved.');
      }
      return tx.appointmentRequest.findUnique({ where: { id } });
    });
  }

  reject(id: number, rejectionReason: string) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.appointmentRequest.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundException('Appointment request not found.');
      }
      if (existing.resolutionState !== AppointmentRequestResolution.PENDING) {
        throw new ConflictException('Appointment request already resolved.');
      }
      const claimed = await tx.appointmentRequest.updateMany({
        where: { id, resolutionState: AppointmentRequestResolution.PENDING },
        data: {
          resolutionState: AppointmentRequestResolution.REJECTED,
          rejectionReason,
          resolvedAt: new Date(),
        },
      });
      if (claimed.count === 0) {
        throw new ConflictException('Appointment request already resolved.');
      }
      return tx.appointmentRequest.findUnique({ where: { id } });
    });
  }

  private async requireActiveVeterinarian(tx: Pick<PrismaService, 'user'>, id: number): Promise<void> {
    const user = await tx.user.findUnique({ where: { id }, include: { role: true } });
    if (!user || user.status !== UserStatus.ACTIVE || user.role?.key !== RoleKey.VETERINARIAN) {
      throw new BadRequestException('Assigned user must be an active veterinarian.');
    }
  }

  private translateError(error: unknown): Error {
    const code = this.prismaErrorCode(error);
    if (code === 'P2002' || code === 'P2003') {
      return new ConflictException('Appointment conflicts with existing data.');
    }
    if (code === 'P2025') {
      return new NotFoundException('Appointment request not found.');
    }
    throw error;
  }

  private prismaErrorCode(error: unknown): string | undefined {
    return typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string'
      ? error.code
      : undefined;
  }
}
