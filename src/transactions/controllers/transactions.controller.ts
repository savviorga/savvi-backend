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
} from '@nestjs/common';
import { TransactionsService } from '../services/transactions.service';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { UpdateTransactionDto } from '../dto/update-transaction.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { multerConfig } from 'src/infrastructure/config/multer.config';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  create(@Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionsService.create(createTransactionDto);
  }

  @Post('bulk')
  createBulk(@Body() createTransactionsDto: CreateTransactionDto[]) {
    return this.transactionsService.createBulk(createTransactionsDto);
  }

  @Get()
  findAll() {
    return this.transactionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(id, updateTransactionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.transactionsService.remove(id);
  }

  @Post('upload-files')
  @UseInterceptors(FilesInterceptor('files', 10, multerConfig))
  async uploadFiles(
    @Body('transactionId') transactionId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.transactionsService.uploadTransactionFiles(
      transactionId,
      files,
    );
  }

  @Get(':id/documents')
  async listDocuments(@Param('id') id: string) {
    return this.transactionsService.listTransactionDocuments(id);
  }
}
