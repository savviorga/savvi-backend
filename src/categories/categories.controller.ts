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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('categories')
@ApiBearerAuth('JWT')
@ApiUnauthorizedResponse({ description: 'Token JWT ausente o inválido' })
@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear una categoría',
    description:
      'Crea una categoría (ingreso/egreso) para el usuario autenticado.',
  })
  @ApiCreatedResponse({ description: 'Categoría creada' })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  create(@Req() req: Request, @Body() createCategoryDto: CreateCategoryDto) {
    const userId = (req.user as { userId: string }).userId;
    return this.categoriesService.create(userId, createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar categorías del usuario' })
  @ApiOkResponse({ description: 'Listado de categorías' })
  findAll(@Req() req: Request) {
    const userId = (req.user as { userId: string }).userId;
    return this.categoriesService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una categoría por ID' })
  @ApiParam({
    name: 'id',
    description: 'ID (UUID) de la categoría',
    format: 'uuid',
  })
  @ApiOkResponse({ description: 'Categoría encontrada' })
  @ApiNotFoundResponse({ description: 'La categoría no existe' })
  findOne(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const userId = (req.user as { userId: string }).userId;
    return this.categoriesService.findOne(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar parcialmente una categoría' })
  @ApiParam({
    name: 'id',
    description: 'ID (UUID) de la categoría',
    format: 'uuid',
  })
  @ApiOkResponse({ description: 'Categoría actualizada' })
  @ApiNotFoundResponse({ description: 'La categoría no existe' })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  update(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    const userId = (req.user as { userId: string }).userId;
    return this.categoriesService.update(userId, id, updateCategoryDto);
  }

  @Patch(':id/budget')
  @ApiOperation({
    summary: 'Actualizar el límite de presupuesto de una categoría',
    description:
      'Modifica únicamente el campo budgetLimit de la categoría indicada.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID (UUID) de la categoría',
    format: 'uuid',
  })
  @ApiOkResponse({ description: 'Presupuesto de la categoría actualizado' })
  @ApiNotFoundResponse({ description: 'La categoría no existe' })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  updateBudget(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBudgetDto: UpdateBudgetDto,
  ) {
    const userId = (req.user as { userId: string }).userId;
    return this.categoriesService.updateBudget(userId, id, updateBudgetDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una categoría' })
  @ApiParam({
    name: 'id',
    description: 'ID (UUID) de la categoría',
    format: 'uuid',
  })
  @ApiNoContentResponse({ description: 'Categoría eliminada' })
  @ApiNotFoundResponse({ description: 'La categoría no existe' })
  remove(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const userId = (req.user as { userId: string }).userId;
    return this.categoriesService.remove(userId, id);
  }
}
