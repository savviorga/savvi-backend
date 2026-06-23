import { PartialType } from '@nestjs/swagger';
import { CreateBudgetDetailDto } from './create-budget-detail.dto';

export class UpdateBudgetDetailDto extends PartialType(CreateBudgetDetailDto) {}
