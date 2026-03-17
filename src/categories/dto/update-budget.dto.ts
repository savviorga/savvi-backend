import { IsNumber, IsOptional, IsPositive } from "class-validator";

export class UpdateBudgetDto {
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  budgetLimit?: number;
}

