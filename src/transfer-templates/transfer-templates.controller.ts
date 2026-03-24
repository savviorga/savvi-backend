import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateTransferTemplateDto } from "./dto/create-transfer-template.dto";
import { UpdateTransferTemplateDto } from "./dto/update-transfer-template.dto";
import { ExecuteTransferDto } from "./dto/execute-transfer.dto";
import { TransferTemplatesService } from "./transfer-templates.service";

@UseGuards(JwtAuthGuard)
@Controller("transfer-templates")
export class TransferTemplatesController {
  constructor(
    private readonly transferTemplatesService: TransferTemplatesService,
  ) {}

  @Post()
  create(
    @Req() req: Request,
    @Body() dto: CreateTransferTemplateDto,
  ) {
    const userId = (req.user as any)?.userId as string;
    return this.transferTemplatesService.create(userId, dto);
  }

  @Get()
  findAll(@Req() req: Request) {
    const userId = (req.user as any)?.userId as string;
    return this.transferTemplatesService.findAll(userId);
  }

  @Patch(":id")
  update(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() dto: UpdateTransferTemplateDto,
  ) {
    const userId = (req.user as any)?.userId as string;
    return this.transferTemplatesService.update(userId, id, dto);
  }

  @Patch(":id/toggle")
  toggleActive(@Req() req: Request, @Param("id") id: string) {
    const userId = (req.user as any)?.userId as string;
    return this.transferTemplatesService.toggleActive(userId, id);
  }

  @Post(":id/execute")
  execute(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() dto: ExecuteTransferDto,
  ) {
    const userId = (req.user as any)?.userId as string;
    return this.transferTemplatesService.executeTransfer(userId, {
      ...dto,
      templateId: id,
    });
  }
}

