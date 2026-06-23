import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  IsPositive,
} from 'class-validator';

export const TRANSFER_TRANSACTION_TYPES = [
  'ingreso',
  'egreso',
  'transferencia',
] as const;
export type TransferTransactionType =
  (typeof TRANSFER_TRANSACTION_TYPES)[number];

export class ExecuteTransferDto {
  @ApiPropertyOptional({
    description:
      'ID de la plantilla. Usualmente se toma del path (:id) y no es necesario enviarlo en el body.',
    example: 'a0e1b4c6-2d6a-4a70-a7aa-12e9d4c8f001',
    format: 'uuid',
  })
  @IsOptional()
  @IsString()
  templateId?: string;

  @ApiProperty({
    description: 'Monto de la transferencia a ejecutar',
    example: 1500000,
    minimum: 0.01,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({
    description: 'Tipo de transacción a registrar',
    enum: TRANSFER_TRANSACTION_TYPES,
    example: 'egreso',
  })
  @IsOptional()
  @IsIn(TRANSFER_TRANSACTION_TYPES)
  transactionType?: TransferTransactionType;

  @ApiPropertyOptional({
    description: 'Descripción opcional que se guardará en la transacción',
    example: 'Pago arriendo abril',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
