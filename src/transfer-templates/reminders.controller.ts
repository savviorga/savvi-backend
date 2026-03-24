import { Controller, Get, Param, Patch, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RemindersService } from "./reminders.service";

@UseGuards(JwtAuthGuard)
@Controller("reminders")
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Get()
  findPending(@Req() req: Request) {
    const userId = (req.user as any)?.userId as string;
    return this.remindersService.findPendingForUser(userId);
  }

  @Patch(":id/dismiss")
  dismiss(@Req() req: Request, @Param("id") id: string) {
    const userId = (req.user as any)?.userId as string;
    return this.remindersService.dismiss(id, userId);
  }
}

