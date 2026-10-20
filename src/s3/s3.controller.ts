import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
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
import { DownloadUrlQueryDto } from './dto/download-url.dto';
import { isUserKey } from './s3-keys';

/** Vigencia de una URL de descarga pedida por key. */
const DOWNLOAD_URL_TTL_SECONDS = 300;

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

  @Get('download-url')
  @ApiOperation({
    summary: 'URL prefirmada para descargar un archivo propio (GET)',
    description:
      'Solo para keys dentro de `users/<userId>/`. La usa el servidor de Savvi IA para leer las evidencias que el usuario adjuntó en el chat. Vence a los 5 minutos.',
  })
  @ApiOkResponse({ description: 'URL de descarga, tamaño y tipo del archivo' })
  @ApiForbiddenResponse({ description: 'El archivo no es del usuario' })
  @ApiNotFoundResponse({ description: 'El archivo no existe' })
  async getDownloadUrl(
    @Req() req: Request,
    @Query() query: DownloadUrlQueryDto,
  ) {
    const userId = (req.user as { userId: string }).userId;
    if (!isUserKey(userId, query.key)) {
      throw new ForbiddenException('El archivo no pertenece a tu cuenta');
    }
    const info = await this.s3Service.getObjectInfo(query.key);
    if (!info) {
      throw new NotFoundException('El archivo no existe');
    }
    return {
      url: await this.s3Service.getDownloadUrl(
        query.key,
        DOWNLOAD_URL_TTL_SECONDS,
      ),
      expiresIn: DOWNLOAD_URL_TTL_SECONDS,
      size: info.size,
      contentType: info.contentType,
    };
  }
}
