import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { PaymentPlannerService } from "./payment-planner.service";
import { CreateDebtDto } from "./dto/create-debt.dto";
import { UpdateDebtDto } from "./dto/update-debt.dto";
import { RegisterPaymentDto } from "./dto/register-payment.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@UseGuards(JwtAuthGuard)
@Controller("payment-planner")
export class PaymentPlannerController {
  constructor(private readonly paymentPlannerService: PaymentPlannerService) {}

  @Post()
  create(@Req() req: Request, @Body() createDebtDto: CreateDebtDto) {
    const userId = (req.user as { userId: string }).userId;
    return this.paymentPlannerService.create(userId, createDebtDto);
  }

  @Get()
  findAll(@Req() req: Request) {
    const userId = (req.user as { userId: string }).userId;
    return this.paymentPlannerService.findAll(userId);
  }

  @Get("pending")
  findPending(@Req() req: Request) {
    const userId = (req.user as { userId: string }).userId;
    return this.paymentPlannerService.findPending(userId);
  }

  @Get("total-paid")
  getTotalPaid(@Req() req: Request) {
    const userId = (req.user as { userId: string }).userId;
    return this.paymentPlannerService.getTotalPaid(userId);
  }

  @Get(":id")
  findOne(@Req() req: Request, @Param("id") id: string) {
    const userId = (req.user as { userId: string }).userId;
    return this.paymentPlannerService.findOne(userId, id);
  }

  @Patch(":id")
  update(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() updateDebtDto: UpdateDebtDto,
  ) {
    const userId = (req.user as { userId: string }).userId;
    return this.paymentPlannerService.update(userId, id, updateDebtDto);
  }

  @Delete(":id")
  remove(@Req() req: Request, @Param("id") id: string) {
    const userId = (req.user as { userId: string }).userId;
    return this.paymentPlannerService.remove(userId, id);
  }

  @Post(":id/register-payment")
  registerPayment(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() dto: RegisterPaymentDto,
  ) {
    const userId = (req.user as { userId: string }).userId;
    return this.paymentPlannerService.registerPayment(userId, id, dto);
  }
}
