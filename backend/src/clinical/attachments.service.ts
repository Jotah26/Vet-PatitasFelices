import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadAttachmentDto } from './dto/upload-attachment.dto';

const ATTACHMENT_METADATA = {
  id: true,
  consultationId: true,
  fileName: true,
  mimeType: true,
  uploadedById: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class AttachmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async upload(consultationId: number, uploadedById: number, data: UploadAttachmentDto) {
    await this.requireConsultation(consultationId);
    this.validateDataUrlSize(data.dataUrl);
    try {
      return await this.prisma.clinicalAttachment.create({
        data: { ...data, consultationId, uploadedById },
      });
    } catch (error: unknown) {
      throw this.translateError(error);
    }
  }

  private validateDataUrlSize(dataUrl: string): void {
    const match = /^data:[^;,]+;base64,([A-Za-z0-9+/]+={0,2})$/.exec(dataUrl);
    if (!match || Buffer.from(match[1], 'base64').byteLength > 1024 * 1024) {
      throw new BadRequestException('Attachment payload must be a valid base64 data URL of at most 1 MB.');
    }
  }

  async list(consultationId: number) {
    await this.requireConsultation(consultationId);
    return this.prisma.clinicalAttachment.findMany({
      where: { consultationId },
      select: ATTACHMENT_METADATA,
    });
  }

  async getOne(id: number) {
    const attachment = await this.prisma.clinicalAttachment.findUnique({ where: { id } });
    if (!attachment) {
      throw new NotFoundException('Attachment not found.');
    }
    return attachment;
  }

  async remove(id: number) {
    await this.getOne(id);
    try {
      await this.prisma.clinicalAttachment.delete({ where: { id } });
    } catch (error: unknown) {
      throw this.translateError(error);
    }
  }

  private async requireConsultation(id: number): Promise<void> {
    if (!(await this.prisma.consultation.findUnique({ where: { id } }))) {
      throw new NotFoundException('Consultation not found.');
    }
  }

  private translateError(error: unknown): Error {
    const code = this.prismaErrorCode(error);
    if (code === 'P2002' || code === 'P2003') {
      return new ConflictException('Attachment conflicts with existing data.');
    }
    if (code === 'P2025') {
      return new NotFoundException('Attachment not found.');
    }
    throw error;
  }

  private prismaErrorCode(error: unknown): string | undefined {
    return typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string'
      ? error.code
      : undefined;
  }
}
