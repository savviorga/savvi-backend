import {
  IsString,
  IsOptional,
  IsNumber,
  MaxLength,
  IsInt,
  Min,
} from "class-validator";

export class CreateBudgetDetailDto {
  @IsString()
  @MaxLength(200)
  label: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  estimatedAmount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
