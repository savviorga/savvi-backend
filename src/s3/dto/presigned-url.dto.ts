import { ApiProperty } from '@nestjs/swagger';

export class CreatePresignedUploadResponseDto {
  @ApiProperty({
    description: 'URL prefirmada para subir el archivo (PUT)',
    example:
      'https://bucket.s3.amazonaws.com/uploads/1714000000000-archivo.pdf?X-Amz-Signature=...',
  })
  url: string;

  @ApiProperty({
    description: 'Key (ruta) final del objeto dentro del bucket',
    example:
      'users/3634ec95-8ea0-43d6-81ad-f309de27363d/transactions/9f2b0c1e-5a7d-4c2f-9b11-6d0a3e8f4c21-factura.pdf',
  })
  key: string;

  @ApiProperty({ description: 'Segundos de vigencia de la URL', example: 300 })
  expiresIn: number;
}
