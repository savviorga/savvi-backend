import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive } from 'class-validator';

export class UpdateBudgetDto {
  @ApiPropertyOptional({
    description: 'Nuevo límite de presupuesto para la categoría',
    example: 600000,
    minimum: 0.01,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  budgetLimit?: number;
}
