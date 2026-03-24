import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  IsPositive,
} from "class-validator";

export class ExecuteTransferDto {
  @IsString()
  templateId: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsIn(["ingreso", "egreso", "transferencia"])
  transactionType?: "ingreso" | "egreso" | "transferencia";

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

