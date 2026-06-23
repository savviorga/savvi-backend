import { ApiProperty } from '@nestjs/swagger';

export class PresignedUrlResponseDto {
  @ApiProperty({
    description: 'URL prefirmada para subir/descargar el objeto',
    example:
      'https://bucket.s3.amazonaws.com/uploads/1714000000000-archivo.pdf?X-Amz-Signature=...',
  })
  url: string;

  @ApiProperty({
    description: 'Key (ruta) del objeto dentro del bucket',
    example: 'uploads/1714000000000-archivo.pdf',
  })
  key: string;

  @ApiProperty({
    description: 'Nombre del bucket S3',
    example: 'savvi-prod-files',
  })
  bucket: string;

  @ApiProperty({
    description: 'Tiempo de expiración de la URL (en segundos)',
    example: 60,
  })
  expiresIn: number;

  @ApiProperty({
    description: 'Operación permitida por la URL',
    enum: ['putObject', 'getObject'],
    example: 'putObject',
  })
  operation: 'putObject' | 'getObject';
}

export class CreatePresignedUploadResponseDto {
  @ApiProperty({
    description: 'URL prefirmada para subir el archivo (PUT)',
    example:
      'https://bucket.s3.amazonaws.com/uploads/1714000000000-archivo.pdf?X-Amz-Signature=...',
  })
  url: string;

  @ApiProperty({
    description: 'Key (ruta) final del objeto dentro del bucket',
    example: 'uploads/1714000000000-archivo.pdf',
  })
  key: string;
}
