import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  MaxLength,
  IsInt,
  Min,
} from 'class-validator';

export class CreateBudgetDetailDto {
  @ApiProperty({
    description: 'Nombre corto de la partida',
    example: 'Arriendo',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  label: string;

  @ApiPropertyOptional({
    description: 'Notas o referencia (nº factura, proveedor, etc.)',
    example: 'Factura #A-1234, proveedor X',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Monto estimado de esta partida',
    example: 800000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  estimatedAmount?: number;

  @ApiPropertyOptional({
    description: 'Orden de visualización (asc)',
    example: 0,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
