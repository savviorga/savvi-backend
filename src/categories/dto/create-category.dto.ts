import { IsString, IsOptional, IsBoolean, IsUUID, IsNumber, IsPositive, MaxLength, IsHexColor, IsIn } from "class-validator";

export const CATEGORY_TYPE_VALUES = ["ingreso", "egreso"] as const;
export type CategoryType = (typeof CATEGORY_TYPE_VALUES)[number];

export class CreateCategoryDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsIn(CATEGORY_TYPE_VALUES, { message: "type debe ser 'ingreso' o 'egreso'" })
  type: CategoryType;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  @IsHexColor()
  color?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  budgetLimit?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
