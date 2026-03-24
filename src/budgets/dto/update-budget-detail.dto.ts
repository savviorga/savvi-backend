import { PartialType } from "@nestjs/mapped-types";
import { CreateBudgetDetailDto } from "./create-budget-detail.dto";

export class UpdateBudgetDetailDto extends PartialType(CreateBudgetDetailDto) {}
