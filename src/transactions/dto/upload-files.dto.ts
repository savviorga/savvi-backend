import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Cuerpo (multipart/form-data) para subir archivos asociados a una transacción.
 * El archivo binario se envía bajo el campo `files` (array).
 */
export class UploadTransactionFilesDto {
  @ApiProperty({
    description: 'ID de la transacción a la que pertenecen los archivos',
    example: 'a0e1b4c6-2d6a-4a70-a7aa-12e9d4c8f001',
    format: 'uuid',
  })
  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @ApiProperty({
    description: 'Archivos a subir (máx. 10). Enviar como multipart/form-data.',
    type: 'array',
    items: { type: 'string', format: 'binary' },
  })
  files: unknown[];
}
