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
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @MaxLength(100, { message: 'El nombre no puede exceder los 100 caracteres' })
  name: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}|[a-z]+-[0-9]+)$/, {
    message: 'El color debe ser un valor hexadecimal (#FFF o #FFFFFF) o un color de Tailwind (ej: blue-500)',
  })
  color?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean({ message: 'isActive debe ser un valor booleano' })
  isActive?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'isCredit debe ser un valor booleano' })
  isCredit?: boolean;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'creditLimit debe ser un número' })
  @Min(0, { message: 'creditLimit no puede ser negativo' })
  creditLimit?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 }, { message: 'aprRate debe ser un número' })
  @Min(0, { message: 'aprRate no puede ser negativo' })
  @Max(1000, { message: 'aprRate parece demasiado alto' })
  aprRate?: number;

  @IsOptional()
  @IsInt({ message: 'gracePeriodDays debe ser un entero' })
  @Min(0, { message: 'gracePeriodDays no puede ser negativo' })
  gracePeriodDays?: number;

  @IsOptional()
  @IsInt({ message: 'statementDay debe ser un entero' })
  @Min(1, { message: 'statementDay debe estar entre 1 y 31' })
  @Max(31, { message: 'statementDay debe estar entre 1 y 31' })
  statementDay?: number;

  @IsOptional()
  @IsInt({ message: 'dueDay debe ser un entero' })
  @Min(1, { message: 'dueDay debe estar entre 1 y 31' })
  @Max(31, { message: 'dueDay debe estar entre 1 y 31' })
  dueDay?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'minPaymentPercent debe ser un número' })
  @Min(0, { message: 'minPaymentPercent no puede ser negativo' })
  @Max(100, { message: 'minPaymentPercent no puede ser mayor a 100' })
  minPaymentPercent?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'minPaymentAmount debe ser un número' })
  @Min(0, { message: 'minPaymentAmount no puede ser negativo' })
  minPaymentAmount?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El saldo inicial debe ser un número' })
  @Min(0, { message: 'El saldo inicial no puede ser negativo' })
  initialBalance?: number;
}
