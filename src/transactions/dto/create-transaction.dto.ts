import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsNotEmpty,
  IsPositive,
  IsUUID,
  IsIn,
  MaxLength,
  Min,
} from 'class-validator';
import {
  TRANSACTION_TYPES,
  type TransactionType,
} from '../entities/transaction.entity';

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
    enum: TRANSACTION_TYPES,
    example: 'egreso',
  })
  @IsNotEmpty({ message: 'El tipo de transacción es requerido' })
  @IsIn(TRANSACTION_TYPES, {
    message: "El tipo debe ser 'ingreso', 'egreso' o 'transferencia'",
  })
  type: TransactionType;

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
    description: 'Id de la categoría (del mismo usuario)',
    example: '87a1883c-8464-4d0f-b450-771ca2886c38',
    format: 'uuid',
  })
  @IsNotEmpty({ message: 'La categoría es requerida' })
  @IsUUID('all', { message: 'La categoría no es válida' })
  categoryId: string;

  @ApiProperty({
    description: 'Id (UUID) de una cuenta del usuario',
    example: '5b1c9a3e-2f4d-4c6a-9e8b-7a1d2c3b4e5f',
    format: 'uuid',
  })
  @IsNotEmpty({ message: 'La cuenta es requerida' })
  @IsUUID('all', { message: 'La cuenta no es válida' })
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
