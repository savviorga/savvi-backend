import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";
import type { RecurrenceType, TransferFrequency } from "./create-transfer-template.dto";

export class UpdateTransferTemplateDto {
  @IsOptional()
  @IsString()
  fromAccountId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  payeeName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  payeeAccount?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  payeeBank?: string;

  @IsOptional()
  @IsIn(["reminder", "automatic"])
  recurrenceType?: RecurrenceType;

  @IsOptional()
  @IsIn(["weekly", "biweekly", "monthly", "bimonthly", "custom"])
  frequency?: TransferFrequency;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3660)
  customIntervalDays?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(28)
  dayOfMonth?: number;
}
