import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional, Matches } from 'class-validator';
import { CreateTransferTemplateDto } from './create-transfer-template.dto';

export class UpdateTransferTemplateDto extends PartialType(
  CreateTransferTemplateDto,
) {
  @ApiPropertyOptional({
    description:
      'Próxima fecha de vencimiento (YYYY-MM-DD). Si se envía, tiene prioridad sobre la que se recalcula al cambiar frecuencia o día.',
    example: '2026-10-25',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La fecha debe tener el formato YYYY-MM-DD',
  })
  nextDueDate?: string;
}
