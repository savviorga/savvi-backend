import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTransferTemplateDto } from './dto/create-transfer-template.dto';
import { UpdateTransferTemplateDto } from './dto/update-transfer-template.dto';
import { ExecuteTransferDto } from './dto/execute-transfer.dto';
import { TransferTemplatesService } from './transfer-templates.service';

interface AuthenticatedUser {
  userId: string;
}

@ApiTags('transfer-templates')
@ApiBearerAuth('JWT')
@ApiUnauthorizedResponse({ description: 'Token JWT ausente o inválido' })
@UseGuards(JwtAuthGuard)
@Controller('transfer-templates')
export class TransferTemplatesController {
  constructor(
    private readonly transferTemplatesService: TransferTemplatesService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Crear una plantilla de transferencia',
    description:
      'Crea una plantilla recurrente que puede generar recordatorios o ejecutarse automáticamente.',
  })
  @ApiCreatedResponse({ description: 'Plantilla creada' })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  create(@Req() req: Request, @Body() dto: CreateTransferTemplateDto) {
    const userId = (req.user as AuthenticatedUser).userId;
    return this.transferTemplatesService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar plantillas de transferencia del usuario' })
  @ApiOkResponse({ description: 'Listado de plantillas' })
  findAll(@Req() req: Request) {
    const userId = (req.user as AuthenticatedUser).userId;
    return this.transferTemplatesService.findAll(userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar parcialmente una plantilla' })
  @ApiParam({
    name: 'id',
    description: 'ID (UUID) de la plantilla',
    format: 'uuid',
  })
  @ApiOkResponse({ description: 'Plantilla actualizada' })
  @ApiNotFoundResponse({ description: 'La plantilla no existe' })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  update(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTransferTemplateDto,
  ) {
    const userId = (req.user as AuthenticatedUser).userId;
    return this.transferTemplatesService.update(userId, id, dto);
  }

  @Patch(':id/toggle')
  @ApiOperation({
    summary: 'Activar / desactivar la plantilla',
    description: 'Invierte el estado isActive de la plantilla indicada.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID (UUID) de la plantilla',
    format: 'uuid',
  })
  @ApiOkResponse({ description: 'Estado actualizado' })
  @ApiNotFoundResponse({ description: 'La plantilla no existe' })
  toggleActive(@Req() req: Request, @Param('id', ParseUUIDPipe) id: string) {
    const userId = (req.user as AuthenticatedUser).userId;
    return this.transferTemplatesService.toggleActive(userId, id);
  }

  @Post(':id/execute')
  @ApiOperation({
    summary: 'Ejecutar la plantilla',
    description:
      'Ejecuta la transferencia asociada a la plantilla, creando la transacción correspondiente y reprogramando el próximo vencimiento.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID (UUID) de la plantilla',
    format: 'uuid',
  })
  @ApiCreatedResponse({ description: 'Transferencia ejecutada' })
  @ApiNotFoundResponse({ description: 'La plantilla no existe' })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  execute(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ExecuteTransferDto,
  ) {
    const userId = (req.user as AuthenticatedUser).userId;
    return this.transferTemplatesService.executeTransfer(userId, {
      ...dto,
      templateId: id,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una plantilla de transferencia' })
  @ApiParam({
    name: 'id',
    description: 'ID (UUID) de la plantilla',
    format: 'uuid',
  })
  @ApiOkResponse({ description: 'Plantilla eliminada' })
  @ApiNotFoundResponse({ description: 'La plantilla no existe' })
  remove(@Req() req: Request, @Param('id', ParseUUIDPipe) id: string) {
    const userId = (req.user as AuthenticatedUser).userId;
    return this.transferTemplatesService.remove(userId, id);
  }
}
