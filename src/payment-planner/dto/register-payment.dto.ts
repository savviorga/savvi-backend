import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsPositive,
  Min,
} from 'class-validator';

export class RegisterPaymentDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Min(0.01, { message: 'El monto debe ser mayor a 0' })
  amount: number;

  @IsOptional()
  @IsDateString()
  paidAt?: string;

  /** Cuenta desde la que se paga (para crear la transacción) */
  @IsString()
  account: string;

  /** Categoría del gasto (para crear la transacción) */
  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  description?: string;
}
