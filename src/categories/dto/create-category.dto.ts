import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsNumber,
  IsPositive,
  MaxLength,
  IsHexColor,
  IsIn,
} from 'class-validator';

export const CATEGORY_TYPE_VALUES = ['ingreso', 'egreso'] as const;
export type CategoryType = (typeof CATEGORY_TYPE_VALUES)[number];

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Nombre de la categoría',
    example: 'Alimentación',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Tipo de la categoría',
    enum: CATEGORY_TYPE_VALUES,
    example: 'egreso',
  })
  @IsString()
  @IsIn(CATEGORY_TYPE_VALUES, { message: "type debe ser 'ingreso' o 'egreso'" })
  type: CategoryType;

  @ApiPropertyOptional({
    description: 'Identificador del ícono',
    example: 'shopping-cart',
  })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({
    description: 'Color en formato hexadecimal',
    example: '#22c55e',
  })
  @IsOptional()
  @IsString()
  @IsHexColor()
  color?: string;

  @ApiPropertyOptional({
    description: 'Descripción libre de la categoría',
    example: 'Gastos de mercado y restaurantes',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'ID de la categoría padre para jerarquías',
    example: 'b8f2a5a2-6c56-45d7-b5d5-1a0f3c4e5a12',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({
    description: 'Límite de presupuesto asociado a la categoría',
    example: 500000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  budgetLimit?: number;

  @ApiPropertyOptional({
    description: 'Indica si la categoría está activa',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Marca la categoría como predeterminada del sistema',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
