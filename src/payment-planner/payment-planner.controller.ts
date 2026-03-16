import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { PaymentPlannerService } from './payment-planner.service';
import { CreateDebtDto } from './dto/create-debt.dto';
import { UpdateDebtDto } from './dto/update-debt.dto';
import { RegisterPaymentDto } from './dto/register-payment.dto';

@Controller('payment-planner')
export class PaymentPlannerController {
  constructor(private readonly paymentPlannerService: PaymentPlannerService) {}

  @Post()
  create(@Body() createDebtDto: CreateDebtDto) {
    return this.paymentPlannerService.create(createDebtDto);
  }

  @Get()
  findAll() {
    return this.paymentPlannerService.findAll();
  }

  @Get('pending')
  findPending() {
    return this.paymentPlannerService.findPending();
  }

  @Get('total-paid')
  getTotalPaid() {
    return this.paymentPlannerService.getTotalPaid();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentPlannerService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDebtDto: UpdateDebtDto) {
    return this.paymentPlannerService.update(id, updateDebtDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.paymentPlannerService.remove(id);
  }

  @Post(':id/register-payment')
  registerPayment(
    @Param('id') id: string,
    @Body() dto: RegisterPaymentDto,
  ) {
    return this.paymentPlannerService.registerPayment(id, dto);
  }
}
