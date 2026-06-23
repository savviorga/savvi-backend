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
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('accounts')
@ApiBearerAuth('JWT')
@ApiUnauthorizedResponse({ description: 'Token JWT ausente o inválido' })
@UseGuards(JwtAuthGuard)
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear una cuenta',
    description:
      'Crea una cuenta para el usuario autenticado. El userId se extrae del JWT.',
  })
  @ApiCreatedResponse({ description: 'Cuenta creada' })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  create(@Req() req: Request, @Body() createAccountDto: CreateAccountDto) {
    const userId = (req.user as { userId: string }).userId;
    return this.accountsService.create(userId, createAccountDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar cuentas del usuario',
    description: 'Devuelve todas las cuentas asociadas al usuario autenticado.',
  })
  @ApiOkResponse({ description: 'Listado de cuentas' })
  findAll(@Req() req: Request) {
    const userId = (req.user as { userId: string }).userId;
    return this.accountsService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una cuenta por ID' })
  @ApiParam({
    name: 'id',
    description: 'ID (UUID) de la cuenta',
    format: 'uuid',
  })
  @ApiOkResponse({ description: 'Cuenta encontrada' })
  @ApiNotFoundResponse({ description: 'La cuenta no existe' })
  findOne(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const userId = (req.user as { userId: string }).userId;
    return this.accountsService.findOne(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar parcialmente una cuenta' })
  @ApiParam({
    name: 'id',
    description: 'ID (UUID) de la cuenta',
    format: 'uuid',
  })
  @ApiOkResponse({ description: 'Cuenta actualizada' })
  @ApiNotFoundResponse({ description: 'La cuenta no existe' })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  update(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAccountDto: UpdateAccountDto,
  ) {
    const userId = (req.user as { userId: string }).userId;
    return this.accountsService.update(userId, id, updateAccountDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una cuenta' })
  @ApiParam({
    name: 'id',
    description: 'ID (UUID) de la cuenta',
    format: 'uuid',
  })
  @ApiNoContentResponse({ description: 'Cuenta eliminada' })
  @ApiNotFoundResponse({ description: 'La cuenta no existe' })
  remove(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const userId = (req.user as { userId: string }).userId;
    return this.accountsService.remove(userId, id);
  }
}
