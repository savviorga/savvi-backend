import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RemindersService } from './reminders.service';

interface AuthenticatedUser {
  userId: string;
}

@ApiTags('reminders')
@ApiBearerAuth('JWT')
@ApiUnauthorizedResponse({ description: 'Token JWT ausente o inválido' })
@UseGuards(JwtAuthGuard)
@Controller('reminders')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar recordatorios pendientes',
    description:
      'Devuelve los recordatorios en estado "scheduled" para las plantillas del usuario.',
  })
  @ApiOkResponse({ description: 'Listado de recordatorios pendientes' })
  findPending(@Req() req: Request) {
    const userId = (req.user as AuthenticatedUser).userId;
    return this.remindersService.findPendingForUser(userId);
  }

  @Patch(':id/dismiss')
  @ApiOperation({
    summary: 'Descartar un recordatorio',
    description:
      'Marca el recordatorio como "dismissed" para que no vuelva a aparecer.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID (UUID) del recordatorio',
    format: 'uuid',
  })
  @ApiOkResponse({ description: 'Recordatorio descartado' })
  @ApiNotFoundResponse({ description: 'El recordatorio no existe' })
  dismiss(@Req() req: Request, @Param('id', ParseUUIDPipe) id: string) {
    const userId = (req.user as AuthenticatedUser).userId;
    return this.remindersService.dismiss(id, userId);
  }
}
