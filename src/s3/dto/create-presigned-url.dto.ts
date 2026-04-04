import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max } from 'class-validator';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

const ALLOWED_CONTENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export { ALLOWED_CONTENT_TYPES, MAX_FILE_SIZE };

export class CreatePresignedUrlDto {
  @IsString({ message: 'filename debe ser un string' })
  @IsNotEmpty({ message: 'filename es requerido' })
  filename: string;

  @IsString({ message: 'contentType debe ser un string' })
  @IsNotEmpty({ message: 'contentType es requerido' })
  contentType: string;

  @IsString()
  @IsOptional()
  folder?: string;

  @IsInt({ message: 'fileSize debe ser un entero' })
  @Min(1, { message: 'fileSize debe ser mayor a 0' })
  @Max(MAX_FILE_SIZE, { message: `fileSize no puede superar ${MAX_FILE_SIZE / 1024 / 1024} MB` })
  @IsOptional()
  fileSize?: number;
}
