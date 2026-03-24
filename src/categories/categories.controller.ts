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
import { CategoriesService } from "./categories.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { UpdateBudgetDto } from "./dto/update-budget.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@UseGuards(JwtAuthGuard)
@Controller("categories")
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  create(@Req() req: Request, @Body() createCategoryDto: CreateCategoryDto) {
    const userId = (req.user as { userId: string }).userId;
    return this.categoriesService.create(userId, createCategoryDto);
  }

  @Get()
  findAll(@Req() req: Request) {
    const userId = (req.user as { userId: string }).userId;
    return this.categoriesService.findAll(userId);
  }

  @Get(":id")
  findOne(@Req() req: Request, @Param("id") id: string) {
    const userId = (req.user as { userId: string }).userId;
    return this.categoriesService.findOne(userId, id);
  }

  @Patch(":id")
  update(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    const userId = (req.user as { userId: string }).userId;
    return this.categoriesService.update(userId, id, updateCategoryDto);
  }

  @Patch(":id/budget")
  updateBudget(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() updateBudgetDto: UpdateBudgetDto,
  ) {
    const userId = (req.user as { userId: string }).userId;
    return this.categoriesService.updateBudget(userId, id, updateBudgetDto);
  }

  @Delete(":id")
  remove(@Req() req: Request, @Param("id") id: string) {
    const userId = (req.user as { userId: string }).userId;
    return this.categoriesService.remove(userId, id);
  }
}
