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
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Request } from 'express';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { TransactionsService } from '../services/transactions.service';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { UpdateTransactionDto } from '../dto/update-transaction.dto';
import { ConfirmUploadDto } from '../dto/confirm-upload.dto';
import { multerConfig } from '../../infrastructure/config/multer.config';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('transactions')
@ApiBearerAuth('JWT')
@ApiUnauthorizedResponse({ description: 'Token JWT ausente o inválido' })
@ApiExtraModels(CreateTransactionDto)
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear una transacción',
    description: 'Crea una transacción para el usuario autenticado.',
  })
  @ApiCreatedResponse({ description: 'Transacción creada' })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  create(
    @Req() req: Request,
    @Body() createTransactionDto: CreateTransactionDto,
  ) {
    const userId = (req.user as { userId: string }).userId;
    return this.transactionsService.create(userId, createTransactionDto);
  }

  @Post('bulk')
  @ApiOperation({
    summary: 'Crear transacciones en lote',
    description: 'Crea múltiples transacciones en una sola petición.',
  })
  @ApiBody({
    description: 'Arreglo de transacciones a crear',
    schema: {
      type: 'array',
      items: { $ref: getSchemaPath(CreateTransactionDto) },
    },
  })
  @ApiCreatedResponse({ description: 'Transacciones creadas' })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  createBulk(
    @Req() req: Request,
    @Body() createTransactionsDto: CreateTransactionDto[],
  ) {
    const userId = (req.user as { userId: string }).userId;
    return this.transactionsService.createBulk(userId, createTransactionsDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar transacciones del usuario' })
  @ApiOkResponse({ description: 'Listado de transacciones' })
  findAll(@Req() req: Request) {
    const userId = (req.user as { userId: string }).userId;
    return this.transactionsService.findAll(userId);
  }

  @Get(':id/documents')
  @ApiOperation({
    summary: 'Listar documentos asociados a una transacción',
    description: 'Devuelve los documentos (S3) vinculados a la transacción.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID (UUID) de la transacción',
    format: 'uuid',
  })
  @ApiOkResponse({ description: 'Listado de documentos' })
  @ApiNotFoundResponse({ description: 'La transacción no existe' })
  listDocuments(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const userId = (req.user as { userId: string }).userId;
    return this.transactionsService.listTransactionDocuments(userId, id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una transacción por ID' })
  @ApiParam({
    name: 'id',
    description: 'ID (UUID) de la transacción',
    format: 'uuid',
  })
  @ApiOkResponse({ description: 'Transacción encontrada' })
  @ApiNotFoundResponse({ description: 'La transacción no existe' })
  findOne(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const userId = (req.user as { userId: string }).userId;
    return this.transactionsService.findOne(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar parcialmente una transacción' })
  @ApiParam({
    name: 'id',
    description: 'ID (UUID) de la transacción',
    format: 'uuid',
  })
  @ApiOkResponse({ description: 'Transacción actualizada' })
  @ApiNotFoundResponse({ description: 'La transacción no existe' })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  update(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    const userId = (req.user as { userId: string }).userId;
    return this.transactionsService.update(userId, id, updateTransactionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una transacción' })
  @ApiParam({
    name: 'id',
    description: 'ID (UUID) de la transacción',
    format: 'uuid',
  })
  @ApiNoContentResponse({ description: 'Transacción eliminada' })
  @ApiNotFoundResponse({ description: 'La transacción no existe' })
  remove(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const userId = (req.user as { userId: string }).userId;
    return this.transactionsService.remove(userId, id);
  }

  @Post('upload-files')
  @UseInterceptors(FilesInterceptor('files', 10, multerConfig))
  @ApiOperation({
    summary: 'Subir archivos a una transacción (multipart/form-data)',
    description:
      'Sube hasta 10 archivos asociados a la transacción indicada. El backend los reenvía a S3.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Archivos y ID de la transacción a la que se vinculan',
    schema: {
      type: 'object',
      required: ['transactionId', 'files'],
      properties: {
        transactionId: {
          type: 'string',
          format: 'uuid',
          description: 'ID de la transacción',
        },
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Archivos (máx. 10)',
        },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Archivos subidos y documentos creados' })
  @ApiBadRequestResponse({
    description: 'Datos inválidos o archivos no aceptados',
  })
  uploadFiles(
    @Req() req: Request,
    @Body('transactionId') transactionId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const userId = (req.user as { userId: string }).userId;
    return this.transactionsService.uploadTransactionFiles(
      userId,
      transactionId,
      files,
    );
  }

  @Post('confirm-upload')
  @ApiOperation({
    summary: 'Confirmar archivos subidos vía presigned URL',
    description:
      'Confirma archivos ya cargados directamente en S3 desde el cliente (por presigned URL) y registra los Document asociados a la transacción.',
  })
  @ApiCreatedResponse({ description: 'Documentos registrados' })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  confirmUpload(@Req() req: Request, @Body() dto: ConfirmUploadDto) {
    const userId = (req.user as { userId: string }).userId;
    return this.transactionsService.confirmUploadedFiles(
      userId,
      dto.transactionId,
      dto.files,
    );
  }
}
