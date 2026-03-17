import {
  IsUUID,
  IsNumber,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsOptional,
  IsIn,
} from 'class-validator';

export const BUDGET_PERIOD_VALUES = ['monthly'] as const;
export type BudgetPeriod = (typeof BUDGET_PERIOD_VALUES)[number];

export class CreateBudgetDto {
  @IsUUID()
  categoryId: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  amount: number;

  @IsIn(BUDGET_PERIOD_VALUES)
  period: BudgetPeriod = 'monthly';

  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;

  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

