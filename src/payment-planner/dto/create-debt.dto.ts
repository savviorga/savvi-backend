import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsPositive,
  MaxLength,
  Min,
  IsBoolean,
  IsIn,
  IsInt,
} from 'class-validator';

export const DEBT_RECURRENCE_VALUES = ['monthly', 'biweekly'] as const;
export type DebtRecurrenceType = (typeof DEBT_RECURRENCE_VALUES)[number];

export class CreateDebtDto {
  @ApiProperty({
    description: 'Nombre o identificador de la deuda',
    example: 'Cuota carro abril',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200, { message: 'El nombre no puede exceder 200 caracteres' })
  name: string;

  @ApiProperty({
    description: 'Beneficiario / entidad a la que se le paga',
    example: 'Banco XYZ',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200, {
    message: 'El beneficiario no puede exceder 200 caracteres',
  })
  payee: string;

  @ApiProperty({
    description: 'Monto total de la deuda',
    example: 2400000,
    minimum: 0.01,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Min(0.01)
  totalAmount: number;

  @ApiProperty({
    description: 'Fecha límite de pago (ISO YYYY-MM-DD)',
    example: '2026-05-15',
    format: 'date',
  })
  @IsDateString({}, { message: 'La fecha límite debe ser ISO (YYYY-MM-DD)' })
  dueDate: string;

  @ApiProperty({
    description: 'ID de la cuenta desde la que se planea pagar',
    example: 'a0e1b4c6-2d6a-4a70-a7aa-12e9d4c8f001',
    format: 'uuid',
  })
  @IsString()
  accountId: string;

  @ApiPropertyOptional({
    description: 'Notas o referencias',
    example: 'Cuota 3 de 12',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({
    description: 'Indica si la deuda es recurrente',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiPropertyOptional({
    description: 'Tipo de recurrencia',
    enum: DEBT_RECURRENCE_VALUES,
    example: 'monthly',
  })
  @IsOptional()
  @IsIn(DEBT_RECURRENCE_VALUES)
  recurrenceType?: DebtRecurrenceType;

  @ApiPropertyOptional({
    description: 'Día del ciclo de recurrencia en el que vence',
    example: 15,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  recurrenceDay?: number;
}
