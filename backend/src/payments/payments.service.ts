import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PaymentStatus } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreatePaymentDto) {
    if (data.appointmentId !== undefined && !(await this.prisma.appointment.findUnique({ where: { id: data.appointmentId } }))) {
      throw new NotFoundException('Appointment not found.');
    }
    try {
      return await this.prisma.payment.create({ data });
    } catch (error: unknown) {
      throw this.translateError(error);
    }
  }

  findAll() {
    return this.prisma.payment.findMany({ where: { status: PaymentStatus.ACTIVE } });
  }

  async findOne(id: number) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment) throw new NotFoundException('Payment not found.');
    return payment;
  }

  async void(id: number) {
    const payment = await this.findOne(id);
    if (payment.status !== PaymentStatus.ACTIVE) throw new ConflictException('Payment is already voided.');
    try {
      return await this.prisma.payment.update({
        where: { id },
        data: { status: PaymentStatus.VOIDED, voidedAt: new Date() },
      });
    } catch (error: unknown) {
      throw this.translateError(error);
    }
  }

  private translateError(error: unknown): Error {
    const code = typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string' ? error.code : undefined;
    if (code === 'P2002' || code === 'P2003') throw new ConflictException('Payment conflicts with existing data.');
    if (code === 'P2025') throw new NotFoundException('Payment not found.');
    throw error;
  }
}
