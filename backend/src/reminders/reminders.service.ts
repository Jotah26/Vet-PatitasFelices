import { Injectable } from '@nestjs/common';
import { RoleKey } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type ReminderUser = { sub: number; role: RoleKey };
type Reminder = { class: 'vaccine' | 'appointment'; petId: number; petName: string | undefined; title: string; date: Date; days: number };

@Injectable()
export class RemindersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(user: ReminderUser, petId?: number) {
    const ownerId = user.role === RoleKey.OWNER
      ? (await this.prisma.owner.findUnique({ where: { userId: user.sub } }))?.id
      : undefined;
    if (user.role === RoleKey.OWNER && ownerId === undefined) return [];
    const pets = await this.prisma.pet.findMany({ where: { ...(ownerId === undefined ? {} : { ownerId }), ...(petId === undefined ? {} : { id: petId }) } });
    const petIds = pets.map((pet) => pet.id);
    if (petIds.length === 0) return [];

    const [vaccines, appointments] = await Promise.all([
      this.prisma.vaccine.findMany({ where: { petId: { in: petIds } } }),
      this.prisma.appointment.findMany({ where: { petId: { in: petIds }, status: { notIn: ['ATTENDED', 'CANCELLED'] }, scheduledAt: { gte: new Date(), lte: new Date(Date.now() + 10 * 86400000) } } }),
    ]);
    const names = new Map(pets.map((pet) => [pet.id, pet.name]));
    const reminders: Reminder[] = vaccines
      .filter((vaccine) => vaccine.nextDueAt && vaccine.nextDueAt.getTime() <= Date.now() + 30 * 86400000)
      .map((vaccine) => ({
        class: 'vaccine' as const,
        petId: vaccine.petId,
        petName: names.get(vaccine.petId),
        title: vaccine.name,
        date: vaccine.nextDueAt!,
        days: this.daysUntil(vaccine.nextDueAt!),
      }));
    reminders.push(...appointments.map((appointment) => ({
      class: 'appointment' as const,
      petId: appointment.petId,
      petName: names.get(appointment.petId),
      title: appointment.reason,
      date: appointment.scheduledAt,
      days: this.daysUntil(appointment.scheduledAt),
    })));
    return reminders.sort((a, b) => a.days - b.days);
  }

  private daysUntil(date: Date): number {
    return Math.ceil((date.getTime() - Date.now()) / 86400000);
  }
}
