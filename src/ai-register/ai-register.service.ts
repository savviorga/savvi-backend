import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionsService } from '../transactions/services/transactions.service';
import { CreateTransactionDto } from '../transactions/dto/create-transaction.dto';
import { S3Service } from '../s3/s3.service';
import { CreateAiRegisterJobDto } from './dto/create-ai-register-job.dto';
import { AiRegisterJobResponseDto } from './dto/ai-register-job-response.dto';
import { AiRegisterJob } from './entities/ai-register-job.entity';

type ExtractedTransactionData = Pick<
  CreateTransactionDto,
  'date' | 'type' | 'amount' | 'category' | 'account' | 'description'
>;

const SUPPORTED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/jpg',
  'image/webp',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/webm',
  'audio/ogg',
  'audio/mp4',
  'audio/x-m4a',
]);

@Injectable()
export class AiRegisterService {
  constructor(
    @InjectRepository(AiRegisterJob)
    private readonly aiRegisterJobRepository: Repository<AiRegisterJob>,
    private readonly transactionsService: TransactionsService,
    private readonly s3Service: S3Service,
  ) {}

  async createJob(
    userId: string,
    dto: CreateAiRegisterJobDto,
  ): Promise<AiRegisterJobResponseDto> {
    this.validateCreateJobInput(dto);
    await this.assertUserOwnsFile(dto.key);

    const job = this.aiRegisterJobRepository.create({
      userId,
      fileKey: dto.key,
      fileName: dto.name,
      fileSize: dto.size,
      mimeType: dto.mimeType,
      userText: dto.userText,
      status: 'queued',
    });

    const saved = await this.aiRegisterJobRepository.save(job);
    void this.processJob(saved.id);
    return this.toResponse(saved);
  }

  async getJob(userId: string, id: string): Promise<AiRegisterJobResponseDto> {
    const job = await this.aiRegisterJobRepository.findOne({ where: { id, userId } });
    if (!job) {
      throw new NotFoundException('Job no encontrado');
    }
    return this.toResponse(job);
  }

  private async processJob(jobId: string): Promise<void> {
    const job = await this.aiRegisterJobRepository.findOne({ where: { id: jobId } });
    if (!job) return;

    try {
      await this.aiRegisterJobRepository.update(job.id, { status: 'processing', error: null });
      const extractedData = this.extractTransactionData(job);
      const transaction = await this.transactionsService.create(
        job.userId,
        extractedData,
      );
      await this.aiRegisterJobRepository.update(job.id, {
        status: 'completed',
        extractedPayload: extractedData,
        createdTransactionId: transaction.id,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error procesando archivo para registro';
      await this.aiRegisterJobRepository.update(job.id, {
        status: 'failed',
        error: message.slice(0, 500),
      });
    }
  }

  private toResponse(job: AiRegisterJob): AiRegisterJobResponseDto {
    return {
      id: job.id,
      status: job.status,
      error: job.error ?? null,
      transactionId: job.createdTransactionId ?? null,
    };
  }

  private validateCreateJobInput(dto: CreateAiRegisterJobDto): void {
    if (!SUPPORTED_MIME_TYPES.has(dto.mimeType)) {
      throw new BadRequestException(
        `Tipo de archivo no soportado para IA: ${dto.mimeType}`,
      );
    }
    if (dto.size > 20 * 1024 * 1024) {
      throw new BadRequestException('El archivo excede 20MB');
    }
  }

  private async assertUserOwnsFile(fileKey: string): Promise<void> {
    if (!fileKey.startsWith('savvi-ia/')) {
      throw new BadRequestException('El archivo debe subirse en la carpeta savvi-ia');
    }
    const files = await this.s3Service.listFiles('savvi-ia');
    const keyMatch = files.some((key) => key === fileKey);
    if (!keyMatch) {
      throw new BadRequestException('El archivo indicado no existe o no es accesible');
    }
  }

  private extractTransactionData(job: AiRegisterJob): ExtractedTransactionData {
    const textInput = `${job.fileName} ${job.userText || ''}`.trim().toLowerCase();

    const amount = this.extractAmount(textInput);
    if (!amount || amount <= 0) {
      throw new BadRequestException(
        'No se pudo extraer un monto valido del audio/imagen.',
      );
    }

    return {
      date: new Date().toISOString().slice(0, 10),
      type: this.extractType(textInput),
      amount,
      category: this.extractCategory(textInput),
      account: this.extractAccount(textInput),
      description: this.extractDescription(job),
    };
  }

  private extractAmount(input: string): number | null {
    const amountMatch = input.match(/(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)/);
    if (!amountMatch) return null;

    const normalized = amountMatch[1].replace(/\./g, '').replace(',', '.');
    const parsed = Number(normalized);
    if (Number.isNaN(parsed)) return null;
    return Math.round(parsed * 100) / 100;
  }

  private extractType(input: string): CreateTransactionDto['type'] {
    if (/(ingreso|abono|deposito|salario|venta)/.test(input)) {
      return 'ingreso';
    }
    if (/(transfer|transferencia)/.test(input)) {
      return 'transferencia';
    }
    return 'egreso';
  }

  private extractCategory(input: string): string {
    if (/(super|mercado|comida|restaurante)/.test(input)) return 'Alimentación';
    if (/(gasolina|transporte|uber|taxi|bus)/.test(input)) return 'Transporte';
    if (/(arriendo|renta|vivienda)/.test(input)) return 'Vivienda';
    if (/(servicio|luz|agua|internet|telefono)/.test(input)) return 'Servicios';
    if (/(salario|nomina|pago empresa)/.test(input)) return 'Ingresos';
    return 'General';
  }

  private extractAccount(input: string): string {
    if (/(credito|tarjeta)/.test(input)) return 'Tarjeta de crédito';
    if (/(ahorro|ahorros)/.test(input)) return 'Cuenta de ahorros';
    return 'Cuenta principal';
  }

  private extractDescription(job: AiRegisterJob): string {
    const mode = job.mimeType.startsWith('audio/') ? 'audio' : 'imagen';
    const base = `Registro automático desde ${mode}: ${job.fileName}`;
    if (!job.userText) return base;
    return `${base}. Contexto: ${job.userText}`.slice(0, 500);
  }
}
