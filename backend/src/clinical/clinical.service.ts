import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { RoleKey, UserStatus } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { CreateVaccineDto } from './dto/create-vaccine.dto';
import { RegisterAttentionDto } from './dto/register-attention.dto';

type PrismaClientLike = Pick<PrismaService, 'pet' | 'user' | 'consultation' | 'vaccine' | 'prescription'>;

@Injectable()
export class ClinicalService {
  constructor(private readonly prisma: PrismaService) {}

  registerAttention(data: RegisterAttentionDto) {
    return this.prisma.$transaction(async (tx) => {
      await this.requirePet(tx, data.petId);
      await this.requireActiveVeterinarian(tx, data.veterinarianId);
      const consultation = await tx.consultation.create({
        data: {
          petId: data.petId,
          veterinarianId: data.veterinarianId,
          type: data.type,
          diagnosis: data.diagnosis,
          treatment: data.treatment,
          recommendations: data.recommendations,
        },
      });
      const vaccines = [];
      for (const vaccine of data.vaccines ?? []) {
        vaccines.push(
          await tx.vaccine.create({
            data: {
              petId: data.petId,
              consultationId: consultation.id,
              name: vaccine.name,
              batch: vaccine.batch ?? null,
              nextDueAt: vaccine.nextDueAt ?? null,
              administeredById: data.veterinarianId,
            },
          }),
        );
      }
      let prescription = null;
      if (data.prescription && data.prescription.items.length > 0) {
        try {
          prescription = await tx.prescription.create({
            data: {
              petId: data.petId,
              veterinarianId: data.veterinarianId,
              consultationId: consultation.id,
              instructions: data.prescription.instructions ?? null,
              items: {
                create: data.prescription.items.map((item) => ({
                  medication: item.medication,
                  dose: item.dose,
                  days: item.days,
                })),
              },
            },
          });
        } catch (error: unknown) {
          throw this.translateError(error);
        }
      }
      return { ...consultation, vaccines, prescription };
    });
  }

  listConsultations(petId?: number) {
    return this.prisma.consultation.findMany({ where: petId === undefined ? undefined : { petId } });
  }

  async getConsultation(id: number) {
    const consultation = await this.prisma.consultation.findUnique({ where: { id } });
    if (!consultation) {
      throw new NotFoundException('Consultation not found.');
    }
    return consultation;
  }

  listVaccines(petId?: number) {
    return this.prisma.vaccine.findMany({ where: petId === undefined ? undefined : { petId } });
  }

  async createVaccine(data: CreateVaccineDto) {
    await this.requirePet(this.prisma, data.petId);
    if (data.consultationId !== undefined) {
      await this.getConsultation(data.consultationId);
    }
    if (data.administeredById !== undefined) {
      await this.requireActiveVeterinarian(this.prisma, data.administeredById);
    }
    try {
      return await this.prisma.vaccine.create({ data });
    } catch (error: unknown) {
      throw this.translateError(error);
    }
  }

  listPrescriptions(petId?: number) {
    return this.prisma.prescription.findMany({ where: petId === undefined ? undefined : { petId } });
  }

  async createPrescription(data: CreatePrescriptionDto) {
    await this.requirePet(this.prisma, data.petId);
    await this.requireActiveVeterinarian(this.prisma, data.veterinarianId);
    if (data.consultationId !== undefined) {
      await this.getConsultation(data.consultationId);
    }
    try {
      return await this.prisma.prescription.create({
        data: {
          petId: data.petId,
          veterinarianId: data.veterinarianId,
          consultationId: data.consultationId ?? null,
          instructions: data.instructions ?? null,
          items: {
            create: data.items.map((item) => ({
              medication: item.medication,
              dose: item.dose,
              days: item.days,
            })),
          },
        },
      });
    } catch (error: unknown) {
      throw this.translateError(error);
    }
  }

  private async requirePet(client: PrismaClientLike, id: number): Promise<void> {
    if (!(await client.pet.findUnique({ where: { id } }))) {
      throw new NotFoundException('Pet not found.');
    }
  }

  private async requireActiveVeterinarian(client: PrismaClientLike, id: number): Promise<void> {
    const user = await client.user.findUnique({ where: { id }, include: { role: true } });
    if (!user || user.status !== UserStatus.ACTIVE || user.role?.key !== RoleKey.VETERINARIAN) {
      throw new BadRequestException('Assigned user must be an active veterinarian.');
    }
  }

  private translateError(error: unknown): Error {
    const code = this.prismaErrorCode(error);
    if (code === 'P2002' || code === 'P2003') {
      return new ConflictException('Clinical record conflicts with existing data.');
    }
    if (code === 'P2025') {
      return new NotFoundException('Clinical record not found.');
    }
    throw error;
  }

  private prismaErrorCode(error: unknown): string | undefined {
    return typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string'
      ? error.code
      : undefined;
  }
}
