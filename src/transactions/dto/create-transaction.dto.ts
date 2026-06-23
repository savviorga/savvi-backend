import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsNotEmpty,
  IsPositive,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateTransactionDto {
  @ApiProperty({
    description: 'Fecha de la transacción (formato ISO YYYY-MM-DD)',
    example: '2026-04-22',
    format: 'date',
  })
  @IsDateString(
    {},
    { message: 'La fecha debe ser un formato ISO válido (ej: 2026-01-12)' },
  )
  @IsNotEmpty({ message: 'La fecha es requerida' })
  date: string;

  @ApiProperty({
    description: 'Tipo de la transacción',
    example: 'egreso',
  })
  @IsNotEmpty({ message: 'El tipo de transacción es requerido' })
  type: string;

  @ApiProperty({
    description: 'Monto de la transacción',
    example: 45000.5,
    minimum: 0.01,
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El monto debe ser un número con máximo 2 decimales' },
  )
  @IsPositive({ message: 'El monto debe ser un número positivo' })
  @Min(0.01, { message: 'El monto mínimo es 0.01' })
  amount: number;

  @ApiProperty({
    description: 'Categoría asociada a la transacción',
    example: 'Alimentación',
    maxLength: 100,
  })
  @IsString({ message: 'La categoría debe ser texto' })
  @IsNotEmpty({ message: 'La categoría es requerida' })
  @MaxLength(100, {
    message: 'La categoría no puede exceder los 100 caracteres',
  })
  category: string;

  @ApiProperty({
    description: 'Cuenta asociada a la transacción',
    example: 'Cuenta Corriente Banco',
    maxLength: 100,
  })
  @IsString({ message: 'La cuenta debe ser texto' })
  @IsNotEmpty({ message: 'La cuenta es requerida' })
  @MaxLength(100, { message: 'La cuenta no puede exceder los 100 caracteres' })
  account: string;

  @ApiPropertyOptional({
    description: 'Descripción adicional de la transacción',
    example: 'Compra supermercado',
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  @MaxLength(500, {
    message: 'La descripción no puede exceder los 500 caracteres',
  })
  description?: string;
}
