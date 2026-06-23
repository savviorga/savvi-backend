import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  Max,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export const TRANSFER_RECURRENCE_VALUES = ['reminder', 'automatic'] as const;
export type RecurrenceType = (typeof TRANSFER_RECURRENCE_VALUES)[number];

export const TRANSFER_FREQUENCY_VALUES = [
  'weekly',
  'biweekly',
  'monthly',
  'bimonthly',
  'custom',
] as const;
export type TransferFrequency = (typeof TRANSFER_FREQUENCY_VALUES)[number];

export class CreateTransferTemplateDto {
  @ApiProperty({
    description: 'ID de la cuenta origen',
    example: 'a0e1b4c6-2d6a-4a70-a7aa-12e9d4c8f001',
    format: 'uuid',
  })
  @IsString()
  fromAccountId: string;

  @ApiProperty({
    description: 'Nombre descriptivo de la plantilla',
    example: 'Arriendo apartamento',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({
    description: 'Nombre del beneficiario de la transferencia',
    example: 'Inmobiliaria ABC',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  payeeName: string;

  @ApiPropertyOptional({
    description: 'Cuenta destino del beneficiario (opcional)',
    example: '0011223344',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  payeeAccount?: string;

  @ApiPropertyOptional({
    description: 'Banco del beneficiario',
    example: 'Banco XYZ',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  payeeBank?: string;

  @ApiPropertyOptional({
    description: 'Monto sugerido inicial',
    example: 1500000,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  initialAmount?: number;

  @ApiProperty({
    description:
      'Si "reminder" crea recordatorios; si "automatic" ejecuta la transferencia automáticamente',
    enum: TRANSFER_RECURRENCE_VALUES,
    example: 'reminder',
  })
  @IsIn(TRANSFER_RECURRENCE_VALUES)
  recurrenceType: RecurrenceType;

  @ApiProperty({
    description: 'Frecuencia con la que se repite la transferencia',
    enum: TRANSFER_FREQUENCY_VALUES,
    example: 'monthly',
  })
  @IsIn(TRANSFER_FREQUENCY_VALUES)
  frequency: TransferFrequency;

  @ApiPropertyOptional({
    description:
      'Intervalo en días entre vencimientos (obligatorio si frequency="custom"). 1 = cada día, 365 ≈ 1 año',
    example: 30,
    minimum: 1,
    maximum: 3660,
  })
  @ValidateIf((o: CreateTransferTemplateDto) => o.frequency === 'custom')
  @IsInt()
  @Min(1)
  @Max(3660)
  customIntervalDays?: number;

  @ApiProperty({
    description: 'Día del mes en el que se programa el vencimiento (1–28)',
    example: 5,
    minimum: 1,
    maximum: 28,
  })
  @IsInt()
  @Min(1)
  @Max(28)
  dayOfMonth: number;
}
