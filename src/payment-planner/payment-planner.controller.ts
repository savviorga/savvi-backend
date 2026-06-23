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
import { PaymentPlannerService } from './payment-planner.service';
import { CreateDebtDto } from './dto/create-debt.dto';
import { UpdateDebtDto } from './dto/update-debt.dto';
import { RegisterPaymentDto } from './dto/register-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('payment-planner')
@ApiBearerAuth('JWT')
@ApiUnauthorizedResponse({ description: 'Token JWT ausente o inválido' })
@UseGuards(JwtAuthGuard)
@Controller('payment-planner')
export class PaymentPlannerController {
  constructor(private readonly paymentPlannerService: PaymentPlannerService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear una deuda',
    description: 'Registra una nueva obligación/deuda para el usuario.',
  })
  @ApiCreatedResponse({ description: 'Deuda creada' })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  create(@Req() req: Request, @Body() createDebtDto: CreateDebtDto) {
    const userId = (req.user as { userId: string }).userId;
    return this.paymentPlannerService.create(userId, createDebtDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las deudas del usuario' })
  @ApiOkResponse({ description: 'Listado de deudas' })
  findAll(@Req() req: Request) {
    const userId = (req.user as { userId: string }).userId;
    return this.paymentPlannerService.findAll(userId);
  }

  @Get('pending')
  @ApiOperation({
    summary: 'Listar deudas pendientes',
    description: 'Devuelve únicamente las deudas con estado "pending".',
  })
  @ApiOkResponse({ description: 'Listado de deudas pendientes' })
  findPending(@Req() req: Request) {
    const userId = (req.user as { userId: string }).userId;
    return this.paymentPlannerService.findPending(userId);
  }

  @Get('total-paid')
  @ApiOperation({
    summary: 'Obtener el total pagado en deudas',
    description: 'Suma de todos los pagos registrados para el usuario.',
  })
  @ApiOkResponse({
    description: 'Total pagado',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', example: 450000 },
      },
    },
  })
  getTotalPaid(@Req() req: Request) {
    const userId = (req.user as { userId: string }).userId;
    return this.paymentPlannerService.getTotalPaid(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una deuda por ID' })
  @ApiParam({
    name: 'id',
    description: 'ID (UUID) de la deuda',
    format: 'uuid',
  })
  @ApiOkResponse({ description: 'Deuda encontrada' })
  @ApiNotFoundResponse({ description: 'La deuda no existe' })
  findOne(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const userId = (req.user as { userId: string }).userId;
    return this.paymentPlannerService.findOne(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar parcialmente una deuda' })
  @ApiParam({
    name: 'id',
    description: 'ID (UUID) de la deuda',
    format: 'uuid',
  })
  @ApiOkResponse({ description: 'Deuda actualizada' })
  @ApiNotFoundResponse({ description: 'La deuda no existe' })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  update(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDebtDto: UpdateDebtDto,
  ) {
    const userId = (req.user as { userId: string }).userId;
    return this.paymentPlannerService.update(userId, id, updateDebtDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una deuda' })
  @ApiParam({
    name: 'id',
    description: 'ID (UUID) de la deuda',
    format: 'uuid',
  })
  @ApiNoContentResponse({ description: 'Deuda eliminada' })
  @ApiNotFoundResponse({ description: 'La deuda no existe' })
  remove(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const userId = (req.user as { userId: string }).userId;
    return this.paymentPlannerService.remove(userId, id);
  }

  @Post(':id/register-payment')
  @ApiOperation({
    summary: 'Registrar un pago sobre la deuda',
    description:
      'Registra un abono a la deuda, crea la transacción asociada y actualiza el saldo remanente.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID (UUID) de la deuda',
    format: 'uuid',
  })
  @ApiCreatedResponse({ description: 'Pago registrado' })
  @ApiNotFoundResponse({ description: 'La deuda no existe' })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  registerPayment(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RegisterPaymentDto,
  ) {
    const userId = (req.user as { userId: string }).userId;
    return this.paymentPlannerService.registerPayment(userId, id, dto);
  }
}
