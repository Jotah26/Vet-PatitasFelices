import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AppointmentStatus, RoleKey, UserStatus } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

const ALLOWED_STATUS_TRANSITIONS: Readonly<Record<AppointmentStatus, readonly AppointmentStatus[]>> = {
  PENDING: [AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELLED],
  CONFIRMED: [AppointmentStatus.IN_ROOM, AppointmentStatus.CANCELLED],
  IN_ROOM: [AppointmentStatus.ATTENDED, AppointmentStatus.CANCELLED],
  ATTENDED: [],
  CANCELLED: [],
};

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateAppointmentDto) {
    await this.requirePet(data.petId);
    await this.requireActiveVeterinarian(data.veterinarianId);
    try {
      return await this.prisma.appointment.create({ data });
    } catch (error: unknown) {
      return this.translateError(error);
    }
  }

  findAll() {
    return this.prisma.appointment.findMany();
  }

  async findOne(id: number) {
    const appointment = await this.prisma.appointment.findUnique({ where: { id } });
    if (!appointment) {
      throw new NotFoundException('Appointment not found.');
    }
    return appointment;
  }

  async update(id: number, data: UpdateAppointmentDto) {
    await this.findOne(id);
    if (data.petId !== undefined) {
      await this.requirePet(data.petId);
    }
    if (data.veterinarianId !== undefined) {
      await this.requireActiveVeterinarian(data.veterinarianId);
    }
    try {
      return await this.prisma.appointment.update({ where: { id }, data });
    } catch (error: unknown) {
      return this.translateError(error);
    }
  }

  async updateStatus(id: number, status: AppointmentStatus) {
    const appointment = await this.findOne(id);
    this.requireStatusTransition(appointment.status, status, 'Appointment status transition is not allowed.');
    return this.persistStatus(id, status);
  }

  async cancel(id: number) {
    const appointment = await this.findOne(id);
    this.requireStatusTransition(appointment.status, AppointmentStatus.CANCELLED, 'Appointment cannot be cancelled.');
    return this.persistStatus(id, AppointmentStatus.CANCELLED);
  }

  private async requirePet(id: number): Promise<void> {
    if (!(await this.prisma.pet.findUnique({ where: { id } }))) {
      throw new NotFoundException('Pet not found.');
    }
  }

  private async requireActiveVeterinarian(id: number): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id }, include: { role: true } });
    if (!user || user.status !== UserStatus.ACTIVE || user.role.key !== RoleKey.VETERINARIAN) {
      throw new BadRequestException('Assigned user must be an active veterinarian.');
    }
  }

  private async persistStatus(id: number, status: AppointmentStatus) {
    try {
      return await this.prisma.appointment.update({ where: { id }, data: { status } });
    } catch (error: unknown) {
      return this.translateError(error);
    }
  }

  private requireStatusTransition(current: AppointmentStatus, next: AppointmentStatus, message: string): void {
    if (!ALLOWED_STATUS_TRANSITIONS[current].includes(next)) {
      throw new BadRequestException(message);
    }
  }

  private translateError(error: unknown): never {
    const code = this.prismaErrorCode(error);
    if (code === 'P2002' || code === 'P2003') {
      throw new ConflictException('Appointment conflicts with existing data.');
    }
    if (code === 'P2025') {
      throw new NotFoundException('Appointment not found.');
    }
    throw error;
  }

  private prismaErrorCode(error: unknown): string | undefined {
    return typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string'
      ? error.code
      : undefined;
  }
}
