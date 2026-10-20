import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { S3Service } from './s3.service';
import { CreatePresignedUploadResponseDto } from './dto/presigned-url.dto';
import {
  ALLOWED_CONTENT_TYPES,
  CreatePresignedUrlDto,
} from './dto/create-presigned-url.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('s3')
@ApiBearerAuth('JWT')
@ApiUnauthorizedResponse({ description: 'Token JWT ausente o inválido' })
@UseGuards(JwtAuthGuard)
@Controller('s3')
export class S3Controller {
  constructor(private readonly s3Service: S3Service) {}

  @Post('presigned-url')
  @ApiOperation({
    summary: 'Generar una URL prefirmada para subir a S3 (PUT)',
    description:
      'Genera una URL prefirmada para subir el archivo directo a S3. La key la genera el servidor dentro de `users/<userId>/<carpeta>/`; ' +
      'el tamaño (`fileSize`) y el tipo quedan firmados y la URL vence a los 5 minutos.',
  })
  @ApiCreatedResponse({
    description: 'URL prefirmada generada',
    type: CreatePresignedUploadResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Content-Type o carpeta no permitidos u otros datos inválidos',
  })
  async createPresignedUrl(
    @Req() req: Request,
    @Body() dto: CreatePresignedUrlDto,
  ): Promise<CreatePresignedUploadResponseDto> {
    if (!ALLOWED_CONTENT_TYPES.includes(dto.contentType)) {
      throw new BadRequestException(
        `Tipo de archivo no permitido: ${dto.contentType}. Permitidos: ${ALLOWED_CONTENT_TYPES.join(', ')}`,
      );
    }
    const userId = (req.user as { userId: string }).userId;
    return this.s3Service.createUserUploadUrl(userId, dto);
  }
}
