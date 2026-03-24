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
import { BudgetsService } from "./budgets.service";
import { CreateBudgetDto } from "./dto/create-budget.dto";
import { UpdateBudgetDto } from "./dto/update-budget.dto";
import { CreateBudgetDetailDto } from "./dto/create-budget-detail.dto";
import { UpdateBudgetDetailDto } from "./dto/update-budget-detail.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@UseGuards(JwtAuthGuard)
@Controller("budgets")
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Post()
  create(@Req() req: Request, @Body() createBudgetDto: CreateBudgetDto) {
    const userId = (req.user as { userId: string }).userId;
    return this.budgetsService.create(userId, createBudgetDto);
  }

  @Get()
  findAll(@Req() req: Request) {
    const userId = (req.user as { userId: string }).userId;
    return this.budgetsService.findAll(userId);
  }

  /** Partidas del presupuesto (gas, luz, arriendo, etc.) — antes de GET :id */
  @Post(":id/details")
  addDetail(
    @Req() req: Request,
    @Param("id") budgetId: string,
    @Body() dto: CreateBudgetDetailDto,
  ) {
    const userId = (req.user as { userId: string }).userId;
    return this.budgetsService.addDetail(userId, budgetId, dto);
  }

  @Patch(":id/details/:detailId")
  updateDetail(
    @Req() req: Request,
    @Param("id") budgetId: string,
    @Param("detailId") detailId: string,
    @Body() dto: UpdateBudgetDetailDto,
  ) {
    const userId = (req.user as { userId: string }).userId;
    return this.budgetsService.updateDetail(userId, budgetId, detailId, dto);
  }

  @Delete(":id/details/:detailId")
  removeDetail(
    @Req() req: Request,
    @Param("id") budgetId: string,
    @Param("detailId") detailId: string,
  ) {
    const userId = (req.user as { userId: string }).userId;
    return this.budgetsService.removeDetail(userId, budgetId, detailId);
  }

  @Get(":id")
  findOne(@Req() req: Request, @Param("id") id: string) {
    const userId = (req.user as { userId: string }).userId;
    return this.budgetsService.findOne(userId, id);
  }

  @Patch(":id")
  update(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() updateBudgetDto: UpdateBudgetDto,
  ) {
    const userId = (req.user as { userId: string }).userId;
    return this.budgetsService.update(userId, id, updateBudgetDto);
  }

  @Delete(":id")
  remove(@Req() req: Request, @Param("id") id: string) {
    const userId = (req.user as { userId: string }).userId;
    return this.budgetsService.remove(userId, id);
  }
}
