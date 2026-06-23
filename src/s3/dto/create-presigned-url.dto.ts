import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
} from 'class-validator';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

const ALLOWED_CONTENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg',
  'image/webp',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/webm',
  'audio/ogg',
  'audio/mp4',
  'audio/x-m4a',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export { ALLOWED_CONTENT_TYPES, MAX_FILE_SIZE };

export class CreatePresignedUrlDto {
  @ApiProperty({
    description: 'Nombre original del archivo',
    example: 'factura-abril.pdf',
  })
  @IsString({ message: 'filename debe ser un string' })
  @IsNotEmpty({ message: 'filename es requerido' })
  filename: string;

  @ApiProperty({
    description: 'MIME type del archivo a subir',
    enum: ALLOWED_CONTENT_TYPES,
    example: 'application/pdf',
  })
  @IsString({ message: 'contentType debe ser un string' })
  @IsNotEmpty({ message: 'contentType es requerido' })
  contentType: string;

  @ApiPropertyOptional({
    description: 'Carpeta (prefijo) dentro del bucket',
    example: 'transactions',
    default: 'uploads',
  })
  @IsString()
  @IsOptional()
  folder?: string;

  @ApiPropertyOptional({
    description: `Tamaño del archivo en bytes (máx. ${MAX_FILE_SIZE / 1024 / 1024} MB)`,
    example: 245678,
    minimum: 1,
    maximum: MAX_FILE_SIZE,
  })
  @IsInt({ message: 'fileSize debe ser un entero' })
  @Min(1, { message: 'fileSize debe ser mayor a 0' })
  @Max(MAX_FILE_SIZE, {
    message: `fileSize no puede superar ${MAX_FILE_SIZE / 1024 / 1024} MB`,
  })
  @IsOptional()
  fileSize?: number;
}
