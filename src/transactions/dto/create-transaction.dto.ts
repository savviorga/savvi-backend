import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsNotEmpty,
  IsEnum,
  IsPositive,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateTransactionDto {
  @IsDateString({}, { message: 'La fecha debe ser un formato ISO válido (ej: 2026-01-12)' })
  @IsNotEmpty({ message: 'La fecha es requerida' })
  date: string;

  @IsNotEmpty({ message: 'El tipo de transacción es requerido' })
  type: string;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El monto debe ser un número con máximo 2 decimales' },
  )
  @IsPositive({ message: 'El monto debe ser un número positivo' })
  @Min(0.01, { message: 'El monto mínimo es 0.01' })
  amount: number;

  @IsString({ message: 'La categoría debe ser texto' })
  @IsNotEmpty({ message: 'La categoría es requerida' })
  @MaxLength(100, { message: 'La categoría no puede exceder los 100 caracteres' })
  category: string;

  @IsString({ message: 'La cuenta debe ser texto' })
  @IsNotEmpty({ message: 'La cuenta es requerida' })
  @MaxLength(100, { message: 'La cuenta no puede exceder los 100 caracteres' })
  account: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  @MaxLength(500, { message: 'La descripción no puede exceder los 500 caracteres' })
  description?: string;
}
