import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { S3Service } from './s3.service';
import {
  CreatePresignedUploadResponseDto,
  PresignedUrlResponseDto,
} from './dto/presigned-url.dto';
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
      'Genera una URL prefirmada que permite al cliente subir el archivo directamente a S3, evitando el límite de tamaño del backend.',
  })
  @ApiCreatedResponse({
    description: 'URL prefirmada generada',
    type: CreatePresignedUploadResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Content-Type no permitido u otros datos inválidos',
  })
  async createPresignedUrl(
    @Body() dto: CreatePresignedUrlDto,
  ): Promise<CreatePresignedUploadResponseDto> {
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
  @ApiOperation({
    summary: 'Obtener una URL prefirmada para putObject (vía query)',
    description:
      'Devuelve una URL prefirmada lista para subir un objeto al bucket (PUT). Alternativa al endpoint POST.',
  })
  @ApiQuery({
    name: 'folder',
    required: true,
    description: 'Carpeta (prefijo) dentro del bucket',
    example: 'transactions',
  })
  @ApiQuery({
    name: 'fileName',
    required: true,
    description: 'Nombre del archivo',
    example: 'factura.pdf',
  })
  @ApiQuery({
    name: 'expiresIn',
    required: false,
    description: 'Tiempo de expiración en segundos (opcional)',
    example: 60,
  })
  @ApiOkResponse({
    description: 'URL prefirmada generada',
    type: PresignedUrlResponseDto,
  })
  async generatePresignedUrl(
    @Query('folder') folder: string,
    @Query('fileName') fileName: string,
    @Query('expiresIn') expiresIn?: number,
  ): Promise<PresignedUrlResponseDto> {
    return this.s3Service.generatePresignedUrl(
      folder,
      fileName,
      'putObject',
      expiresIn,
    );
  }
}
