import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class UploadAttachmentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  fileName!: string;

  @IsString()
  @Matches(/^[\w.+-]+\/[\w.+-]+$/)
  mimeType!: string;

  @IsString()
  @Matches(/^data:/)
  @MaxLength(7000000)
  dataUrl!: string;
}
