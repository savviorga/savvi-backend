import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { normalizeMimeType } from '../s3-keys';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
  MaxLength,
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
  @MaxLength(255)
  filename: string;

  @ApiProperty({
    description: 'MIME type del archivo a subir',
    enum: ALLOWED_CONTENT_TYPES,
    example: 'application/pdf',
  })
  @Transform(({ value }: { value: unknown }) => normalizeMimeType(value))
  @IsString({ message: 'contentType debe ser un string' })
  @IsNotEmpty({ message: 'contentType es requerido' })
  contentType: string;

  @ApiPropertyOptional({
    description:
      'Módulo del archivo: `transactions` (o `transactions/<id>`) o `savvi-ia`. Por defecto `transactions`.',
    example: 'transactions',
    default: 'transactions',
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  folder?: string;

  @ApiProperty({
    description: `Tamaño exacto del archivo en bytes (máx. ${MAX_FILE_SIZE / 1024 / 1024} MB). Queda firmado en la URL.`,
    example: 245678,
    minimum: 1,
    maximum: MAX_FILE_SIZE,
  })
  @IsInt({ message: 'fileSize debe ser un entero' })
  @Min(1, { message: 'fileSize debe ser mayor a 0' })
  @Max(MAX_FILE_SIZE, {
    message: `fileSize no puede superar ${MAX_FILE_SIZE / 1024 / 1024} MB`,
  })
  fileSize: number;
}
