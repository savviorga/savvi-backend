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

export class CreateDebtDto {
  @IsString()
  @MaxLength(200, { message: 'El nombre no puede exceder 200 caracteres' })
  name: string;

  @IsString()
  @MaxLength(200, { message: 'El beneficiario no puede exceder 200 caracteres' })
  payee: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Min(0.01)
  totalAmount: number;

  @IsDateString({}, { message: 'La fecha límite debe ser ISO (YYYY-MM-DD)' })
  dueDate: string;

  @IsString()
  // uuid en la base de datos (se valida como string para evitar acoplar el formato exacto)
  accountId: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @IsOptional()
  @IsIn(['monthly', 'biweekly'])
  recurrenceType?: 'monthly' | 'biweekly';

  @IsOptional()
  @IsInt()
  @Min(1)
  recurrenceDay?: number;
}
