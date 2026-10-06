import { Body, Controller, Get, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { STAFF_ROLES } from '../auth/staff-roles';
import { AttachmentsService } from './attachments.service';
import { UploadAttachmentDto } from './dto/upload-attachment.dto';

@Controller('consultations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...STAFF_ROLES)
export class ConsultationAttachmentsController {
  constructor(private readonly attachments: AttachmentsService) {}

  @Post(':id/attachments')
  upload(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
    @Body() data: UploadAttachmentDto,
  ) {
    return this.attachments.upload(id, req.user!.sub, data);
  }

  @Get(':id/attachments')
  findAll(@Param('id', ParseIntPipe) id: number) {
    return this.attachments.list(id);
  }
}
