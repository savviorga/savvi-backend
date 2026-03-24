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
import { AccountsService } from "./accounts.service";
import { CreateAccountDto } from "./dto/create-account.dto";
import { UpdateAccountDto } from "./dto/update-account.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@UseGuards(JwtAuthGuard)
@Controller("accounts")
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  create(@Req() req: Request, @Body() createAccountDto: CreateAccountDto) {
    const userId = (req.user as { userId: string }).userId;
    return this.accountsService.create(userId, createAccountDto);
  }

  @Get()
  findAll(@Req() req: Request) {
    const userId = (req.user as { userId: string }).userId;
    return this.accountsService.findAll(userId);
  }

  @Get(":id")
  findOne(@Req() req: Request, @Param("id") id: string) {
    const userId = (req.user as { userId: string }).userId;
    return this.accountsService.findOne(userId, id);
  }

  @Patch(":id")
  update(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() updateAccountDto: UpdateAccountDto,
  ) {
    const userId = (req.user as { userId: string }).userId;
    return this.accountsService.update(userId, id, updateAccountDto);
  }

  @Delete(":id")
  remove(@Req() req: Request, @Param("id") id: string) {
    const userId = (req.user as { userId: string }).userId;
    return this.accountsService.remove(userId, id);
  }
}
