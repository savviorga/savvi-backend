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
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { CreateBudgetDetailDto } from './dto/create-budget-detail.dto';
import { UpdateBudgetDetailDto } from './dto/update-budget-detail.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('budgets')
@ApiBearerAuth('JWT')
@ApiUnauthorizedResponse({ description: 'Token JWT ausente o inválido' })
@UseGuards(JwtAuthGuard)
@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear un presupuesto',
    description:
      'Crea un presupuesto mensual para una categoría del usuario autenticado.',
  })
  @ApiCreatedResponse({ description: 'Presupuesto creado' })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  create(@Req() req: Request, @Body() createBudgetDto: CreateBudgetDto) {
    const userId = (req.user as { userId: string }).userId;
    return this.budgetsService.create(userId, createBudgetDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar presupuestos del usuario' })
  @ApiOkResponse({ description: 'Listado de presupuestos' })
  findAll(@Req() req: Request) {
    const userId = (req.user as { userId: string }).userId;
    return this.budgetsService.findAll(userId);
  }

  @Post(':id/details')
  @ApiOperation({
    summary: 'Agregar una partida al presupuesto',
    description:
      'Crea una partida (ej. gas, luz, arriendo) dentro del presupuesto indicado.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID (UUID) del presupuesto',
    format: 'uuid',
  })
  @ApiCreatedResponse({ description: 'Partida creada' })
  @ApiNotFoundResponse({ description: 'El presupuesto no existe' })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  addDetail(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) budgetId: string,
    @Body() dto: CreateBudgetDetailDto,
  ) {
    const userId = (req.user as { userId: string }).userId;
    return this.budgetsService.addDetail(userId, budgetId, dto);
  }

  @Patch(':id/details/:detailId')
  @ApiOperation({ summary: 'Actualizar una partida de presupuesto' })
  @ApiParam({
    name: 'id',
    description: 'ID (UUID) del presupuesto',
    format: 'uuid',
  })
  @ApiParam({
    name: 'detailId',
    description: 'ID (UUID) de la partida',
    format: 'uuid',
  })
  @ApiOkResponse({ description: 'Partida actualizada' })
  @ApiNotFoundResponse({ description: 'Presupuesto o partida no encontrados' })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  updateDetail(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) budgetId: string,
    @Param('detailId', ParseUUIDPipe) detailId: string,
    @Body() dto: UpdateBudgetDetailDto,
  ) {
    const userId = (req.user as { userId: string }).userId;
    return this.budgetsService.updateDetail(userId, budgetId, detailId, dto);
  }

  @Delete(':id/details/:detailId')
  @ApiOperation({ summary: 'Eliminar una partida del presupuesto' })
  @ApiParam({
    name: 'id',
    description: 'ID (UUID) del presupuesto',
    format: 'uuid',
  })
  @ApiParam({
    name: 'detailId',
    description: 'ID (UUID) de la partida',
    format: 'uuid',
  })
  @ApiNoContentResponse({ description: 'Partida eliminada' })
  @ApiNotFoundResponse({ description: 'Presupuesto o partida no encontrados' })
  removeDetail(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) budgetId: string,
    @Param('detailId', ParseUUIDPipe) detailId: string,
  ) {
    const userId = (req.user as { userId: string }).userId;
    return this.budgetsService.removeDetail(userId, budgetId, detailId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un presupuesto por ID' })
  @ApiParam({
    name: 'id',
    description: 'ID (UUID) del presupuesto',
    format: 'uuid',
  })
  @ApiOkResponse({ description: 'Presupuesto encontrado' })
  @ApiNotFoundResponse({ description: 'El presupuesto no existe' })
  findOne(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const userId = (req.user as { userId: string }).userId;
    return this.budgetsService.findOne(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar parcialmente un presupuesto' })
  @ApiParam({
    name: 'id',
    description: 'ID (UUID) del presupuesto',
    format: 'uuid',
  })
  @ApiOkResponse({ description: 'Presupuesto actualizado' })
  @ApiNotFoundResponse({ description: 'El presupuesto no existe' })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  update(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBudgetDto: UpdateBudgetDto,
  ) {
    const userId = (req.user as { userId: string }).userId;
    return this.budgetsService.update(userId, id, updateBudgetDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un presupuesto' })
  @ApiParam({
    name: 'id',
    description: 'ID (UUID) del presupuesto',
    format: 'uuid',
  })
  @ApiNoContentResponse({ description: 'Presupuesto eliminado' })
  @ApiNotFoundResponse({ description: 'El presupuesto no existe' })
  remove(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const userId = (req.user as { userId: string }).userId;
    return this.budgetsService.remove(userId, id);
  }
}
