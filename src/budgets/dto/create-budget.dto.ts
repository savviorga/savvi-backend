import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsNumber,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsOptional,
  IsIn,
} from 'class-validator';

export const BUDGET_PERIOD_VALUES = ['monthly'] as const;
export type BudgetPeriod = (typeof BUDGET_PERIOD_VALUES)[number];

export class CreateBudgetDto {
  @ApiProperty({
    description: 'ID de la categoría a la que pertenece el presupuesto',
    example: 'a0e1b4c6-2d6a-4a70-a7aa-12e9d4c8f001',
    format: 'uuid',
  })
  @IsUUID()
  categoryId: string;

  @ApiProperty({
    description:
      'Monto presupuestado. Si amountAutoCalculated=true se ignora al crear y se recalcula a partir de las partidas',
    example: 1500000,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount: number;

  @ApiPropertyOptional({
    description:
      'Si es true, amount se recalcula automáticamente como la suma de estimatedAmount de las partidas',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  amountAutoCalculated?: boolean;

  @ApiProperty({
    description: 'Periodicidad del presupuesto',
    enum: BUDGET_PERIOD_VALUES,
    example: 'monthly',
    default: 'monthly',
  })
  @IsIn(BUDGET_PERIOD_VALUES)
  period: BudgetPeriod = 'monthly';

  @ApiProperty({
    description: 'Año del presupuesto',
    example: 2026,
    minimum: 2000,
    maximum: 2100,
  })
  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;

  @ApiProperty({
    description: 'Mes del presupuesto (1–12)',
    example: 4,
    minimum: 1,
    maximum: 12,
  })
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @ApiPropertyOptional({
    description: 'Indica si el presupuesto está activo',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
