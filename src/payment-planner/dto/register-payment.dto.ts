import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsPositive,
  Min,
} from 'class-validator';

export class RegisterPaymentDto {
  @ApiProperty({
    description: 'Monto del pago a registrar',
    example: 200000,
    minimum: 0.01,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Min(0.01, { message: 'El monto debe ser mayor a 0' })
  amount: number;

  @ApiPropertyOptional({
    description: 'Fecha del pago (ISO). Por defecto: hoy',
    example: '2026-04-22',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @ApiProperty({
    description: 'Cuenta desde la que se paga (se usa para la transacción asociada)',
    example: 'Cuenta Corriente Banco',
  })
  @IsString()
  account: string;

  @ApiProperty({
    description: 'Categoría del gasto (se usa para la transacción asociada)',
    example: 'Deudas',
  })
  @IsString()
  category: string;

  @ApiPropertyOptional({
    description: 'Descripción opcional del pago',
    example: 'Abono mensual',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
