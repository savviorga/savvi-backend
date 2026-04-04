import { Controller, Get, Post, Body, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { S3Service } from './s3.service';
import { PresignedUrlResponseDto } from './dto/presigned-url.dto';
import { CreatePresignedUrlDto, ALLOWED_CONTENT_TYPES } from './dto/create-presigned-url.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('s3')
export class S3Controller {
  constructor(private readonly s3Service: S3Service) {}

  /**
   * Genera una URL prefirmada para subir un archivo directamente a S3.
   * El cliente sube el archivo a S3 sin pasar por el backend (evita el límite de Vercel).
   */
  @Post('presigned-url')
  async createPresignedUrl(
    @Body() dto: CreatePresignedUrlDto,
  ): Promise<{ url: string; key: string }> {
    if (!ALLOWED_CONTENT_TYPES.includes(dto.contentType)) {
      throw new BadRequestException(
        `Tipo de archivo no permitido: ${dto.contentType}. Permitidos: ${ALLOWED_CONTENT_TYPES.join(', ')}`,
      );
    }

    const folder = dto.folder || 'uploads';
    const uniqueKey = `${folder}/${Date.now()}-${dto.filename.replace(/\s+/g, '_')}`;

    const presigned = await this.s3Service.generatePresignedUploadUrl(
      uniqueKey,
      dto.contentType,
      60,
    );

    return { url: presigned.url, key: presigned.key };
  }

  @Get('presigned-url')
  async generatePresignedUrl(
    @Query('folder') folder: string,
    @Query('fileName') fileName: string,
    @Query('expiresIn') expiresIn?: number,
  ): Promise<PresignedUrlResponseDto> {
    return this.s3Service.generatePresignedUrl(folder, fileName, 'putObject', expiresIn);
  }
}
