import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AiRegisterJobResponseDto {
  @ApiProperty({ example: 'b9f6af18-4975-48b9-a6e3-17fd792e353c' })
  id: string;

  @ApiProperty({ enum: ['queued', 'processing', 'completed', 'failed'] })
  status: 'queued' | 'processing' | 'completed' | 'failed';

  @ApiPropertyOptional({ example: 'No se pudo extraer monto de la imagen' })
  error?: string | null;

  @ApiPropertyOptional({ example: '3634ec95-8ea0-43d6-81ad-f309de27363d' })
  transactionId?: string | null;
}
