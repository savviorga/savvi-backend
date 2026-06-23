import { PartialType } from '@nestjs/swagger';
import { CreateTransferTemplateDto } from './create-transfer-template.dto';

export class UpdateTransferTemplateDto extends PartialType(
  CreateTransferTemplateDto,
) {}
