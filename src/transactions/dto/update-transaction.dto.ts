import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { CreateTransactionDto } from './create-transaction.dto';
import { UploadedFileMetadataDto } from './confirm-upload.dto';

export class UpdateTransactionDto extends PartialType(CreateTransactionDto) {
  @ApiPropertyOptional({
    description:
      'IDs de los documentos adjuntos que deben eliminarse (se borran de S3 y de la base de datos)',
    type: [String],
    format: 'uuid',
    example: ['9f2b0c1e-5a7d-4c2f-9b11-6d0a3e8f4c21'],
  })
  @IsOptional()
  @IsArray({ message: 'documentsToDelete debe ser un arreglo' })
  @ArrayMaxSize(50, {
    message: 'No se pueden eliminar más de 50 documentos por petición',
  })
  @IsUUID('all', {
    each: true,
    message: 'Cada documento a eliminar debe ser un UUID válido',
  })
  documentsToDelete?: string[];

  @ApiPropertyOptional({
    description:
      'Archivos ya subidos a S3 (vía URL prefirmada) que se vincularán a la transacción',
    type: () => [UploadedFileMetadataDto],
  })
  @IsOptional()
  @IsArray({ message: 'filesToAdd debe ser un arreglo' })
  @ArrayMaxSize(10, {
    message: 'No se pueden agregar más de 10 archivos por petición',
  })
  @ValidateNested({ each: true })
  @Type(() => UploadedFileMetadataDto)
  filesToAdd?: UploadedFileMetadataDto[];
}
