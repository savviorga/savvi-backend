import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFiles,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { TransactionsService } from "../services/transactions.service";
import { CreateTransactionDto } from "../dto/create-transaction.dto";
import { UpdateTransactionDto } from "../dto/update-transaction.dto";
import { FilesInterceptor } from "@nestjs/platform-express";
import { multerConfig } from "../../infrastructure/config/multer.config";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";

@UseGuards(JwtAuthGuard)
@Controller("transactions")
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  create(@Req() req: Request, @Body() createTransactionDto: CreateTransactionDto) {
    const userId = (req.user as { userId: string }).userId;
    return this.transactionsService.create(userId, createTransactionDto);
  }

  @Post("bulk")
  createBulk(
    @Req() req: Request,
    @Body() createTransactionsDto: CreateTransactionDto[],
  ) {
    const userId = (req.user as { userId: string }).userId;
    return this.transactionsService.createBulk(userId, createTransactionsDto);
  }

  @Get()
  findAll(@Req() req: Request) {
    const userId = (req.user as { userId: string }).userId;
    return this.transactionsService.findAll(userId);
  }

  /** Debe ir antes de @Get(':id') para no confundir el segmento "documents". */
  @Get(":id/documents")
  async listDocuments(@Req() req: Request, @Param("id") id: string) {
    const userId = (req.user as { userId: string }).userId;
    return this.transactionsService.listTransactionDocuments(userId, id);
  }

  @Get(":id")
  findOne(@Req() req: Request, @Param("id") id: string) {
    const userId = (req.user as { userId: string }).userId;
    return this.transactionsService.findOne(userId, id);
  }

  @Patch(":id")
  update(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    const userId = (req.user as { userId: string }).userId;
    return this.transactionsService.update(userId, id, updateTransactionDto);
  }

  @Delete(":id")
  remove(@Req() req: Request, @Param("id") id: string) {
    const userId = (req.user as { userId: string }).userId;
    return this.transactionsService.remove(userId, id);
  }

  @Post("upload-files")
  @UseInterceptors(FilesInterceptor("files", 10, multerConfig))
  async uploadFiles(
    @Req() req: Request,
    @Body("transactionId") transactionId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const userId = (req.user as { userId: string }).userId;
    return this.transactionsService.uploadTransactionFiles(
      userId,
      transactionId,
      files,
    );
  }
}
