import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiUsageService } from './ai-usage.service';
import { RecordAiUsageDto } from './dto/record-ai-usage.dto';

@ApiTags('ai-usage')
@ApiBearerAuth('JWT')
@ApiUnauthorizedResponse({ description: 'Token JWT ausente o inválido' })
@UseGuards(JwtAuthGuard)
@Controller('ai/usage')
export class AiUsageController {
  constructor(private readonly aiUsageService: AiUsageService) {}

  @Get('quota')
  @ApiOperation({
    summary: 'Cuota de IA del usuario',
    description:
      'Indica si el usuario puede hacer otra petición de IA (límites diario y mensual en USD y peticiones por minuto).',
  })
  @ApiOkResponse({ description: 'Estado de la cuota' })
  quota(@Req() req: Request) {
    return this.aiUsageService.getQuota(this.userId(req));
  }

  @Get('summary')
  @ApiOperation({ summary: 'Consumo de IA del mes y total histórico' })
  @ApiOkResponse({ description: 'Resumen de consumo' })
  summary(@Req() req: Request) {
    return this.aiUsageService.getSummary(this.userId(req));
  }

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Registrar el consumo de una petición de IA',
    description:
      'Lo llama el servidor de Next tras cada petición a OpenAI con el token del usuario.',
  })
  @ApiNoContentResponse({ description: 'Consumo registrado' })
  async record(@Req() req: Request, @Body() dto: RecordAiUsageDto) {
    await this.aiUsageService.record(this.userId(req), dto);
  }

  private userId(req: Request): string {
    return (req.user as { userId: string }).userId;
  }
}
