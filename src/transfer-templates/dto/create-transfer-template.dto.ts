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
} from "class-validator";

export type RecurrenceType = "reminder" | "automatic";
export type TransferFrequency =
  | "weekly"
  | "biweekly"
  | "monthly"
  | "bimonthly"
  | "custom";

export class CreateTransferTemplateDto {
  @IsString()
  fromAccountId: string;

  @IsString()
  @MaxLength(200)
  name: string;

  @IsString()
  @MaxLength(200)
  payeeName: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  payeeAccount?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  payeeBank?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  initialAmount?: number;

  @IsIn(["reminder", "automatic"])
  recurrenceType: RecurrenceType;

  @IsIn(["weekly", "biweekly", "monthly", "bimonthly", "custom"])
  frequency: TransferFrequency;

  /** Obligatorio si frequency es "custom" (1 = cada día, 365 ≈ 1 año). */
  @ValidateIf((o: CreateTransferTemplateDto) => o.frequency === "custom")
  @IsInt()
  @Min(1)
  @Max(3660)
  customIntervalDays?: number;

  @IsInt()
  @Min(1)
  @Max(28)
  dayOfMonth: number;
}

