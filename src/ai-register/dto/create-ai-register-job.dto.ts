import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateAiRegisterJobDto {
  @ApiProperty({
    description: 'Clave del objeto en S3',
    example: 'savvi-ia/2026/01/factura-123.jpg',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  key: string;

  @ApiProperty({
    description: 'Nombre original del archivo',
    example: 'factura-enero.jpg',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Tamaño del archivo en bytes',
    example: 235000,
  })
  @IsNumber()
  @Min(1)
  size: number;

  @ApiProperty({
    description: 'MIME type del archivo',
    example: 'image/jpeg',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  mimeType: string;

  @ApiPropertyOptional({
    description: 'Texto libre opcional enviado por el usuario como contexto',
    example: 'Fue una compra en supermercado por 120000',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  userText?: string;
}
