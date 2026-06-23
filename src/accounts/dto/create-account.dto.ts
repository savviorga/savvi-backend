import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  MaxLength,
  Matches,
  IsNumber,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export class CreateAccountDto {
  @ApiProperty({
    description: 'Nombre visible de la cuenta',
    example: 'Cuenta Corriente Banco',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @MaxLength(100, { message: 'El nombre no puede exceder los 100 caracteres' })
  name: string;

  @ApiPropertyOptional({
    description: 'Identificador del ícono (emoji o nombre interno)',
    example: 'credit-card',
  })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({
    description:
      'Color en formato hexadecimal (#FFF / #FFFFFF) o color de Tailwind (ej: blue-500)',
    example: '#3b82f6',
  })
  @IsOptional()
  @IsString()
  @Matches(/^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}|[a-z]+-[0-9]+)$/, {
    message:
      'El color debe ser un valor hexadecimal (#FFF o #FFFFFF) o un color de Tailwind (ej: blue-500)',
  })
  color?: string;

  @ApiPropertyOptional({
    description: 'Descripción libre de la cuenta',
    example: 'Cuenta para gastos diarios',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Indica si la cuenta está activa',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'isActive debe ser un valor booleano' })
  isActive?: boolean;

  @ApiPropertyOptional({
    description:
      'Si es true la cuenta se trata como una cuenta de crédito (ej. tarjeta de crédito)',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'isCredit debe ser un valor booleano' })
  isCredit?: boolean;

  @ApiPropertyOptional({
    description: 'Límite de crédito disponible (solo cuentas de crédito)',
    example: 5000000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'creditLimit debe ser un número' },
  )
  @Min(0, { message: 'creditLimit no puede ser negativo' })
  creditLimit?: number;

  @ApiPropertyOptional({
    description: 'Tasa anual (APR) en porcentaje',
    example: 35.5,
    minimum: 0,
    maximum: 1000,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 }, { message: 'aprRate debe ser un número' })
  @Min(0, { message: 'aprRate no puede ser negativo' })
  @Max(1000, { message: 'aprRate parece demasiado alto' })
  aprRate?: number;

  @ApiPropertyOptional({
    description: 'Periodo de gracia en días',
    example: 30,
    minimum: 0,
  })
  @IsOptional()
  @IsInt({ message: 'gracePeriodDays debe ser un entero' })
  @Min(0, { message: 'gracePeriodDays no puede ser negativo' })
  gracePeriodDays?: number;

  @ApiPropertyOptional({
    description: 'Día del mes del corte del estado (1–31)',
    example: 15,
    minimum: 1,
    maximum: 31,
  })
  @IsOptional()
  @IsInt({ message: 'statementDay debe ser un entero' })
  @Min(1, { message: 'statementDay debe estar entre 1 y 31' })
  @Max(31, { message: 'statementDay debe estar entre 1 y 31' })
  statementDay?: number;

  @ApiPropertyOptional({
    description: 'Día del mes de vencimiento del pago (1–31)',
    example: 5,
    minimum: 1,
    maximum: 31,
  })
  @IsOptional()
  @IsInt({ message: 'dueDay debe ser un entero' })
  @Min(1, { message: 'dueDay debe estar entre 1 y 31' })
  @Max(31, { message: 'dueDay debe estar entre 1 y 31' })
  dueDay?: number;

  @ApiPropertyOptional({
    description: 'Pago mínimo expresado como porcentaje del saldo (0–100)',
    example: 10,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'minPaymentPercent debe ser un número' },
  )
  @Min(0, { message: 'minPaymentPercent no puede ser negativo' })
  @Max(100, { message: 'minPaymentPercent no puede ser mayor a 100' })
  minPaymentPercent?: number;

  @ApiPropertyOptional({
    description: 'Pago mínimo expresado como monto absoluto',
    example: 50000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'minPaymentAmount debe ser un número' },
  )
  @Min(0, { message: 'minPaymentAmount no puede ser negativo' })
  minPaymentAmount?: number;

  @ApiPropertyOptional({
    description: 'Saldo inicial al crear la cuenta',
    example: 150000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El saldo inicial debe ser un número' },
  )
  @Min(0, { message: 'El saldo inicial no puede ser negativo' })
  initialBalance?: number;
}
