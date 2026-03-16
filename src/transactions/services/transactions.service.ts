import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { UpdateTransactionDto } from '../dto/update-transaction.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, TransactionFile } from '../entities/transaction.entity';
import { Document } from '../entities/document.entity';
import { S3Service } from '../../s3/s3.service';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    private readonly s3Service: S3Service,
  ) {}

  async create(
    createTransactionDto: CreateTransactionDto,
  ): Promise<Transaction> {
    const transaction = this.transactionRepository.create({
      ...createTransactionDto,
    });
    return await this.transactionRepository.save(transaction);
  }

  async createBulk(createTransactionsDto: CreateTransactionDto[]) {
    const transactions = this.transactionRepository.create(
      createTransactionsDto,
    );
    const saved = await this.transactionRepository.save(transactions);

    return {
      count: saved.length,
      data: saved,
    };
  }

  findAll() {
    return this.transactionRepository.find();
  }

  findOne(id: string) {
    return this.transactionRepository.findOneBy({ id });
  }

  async update(id: string, updateTransactionDto: UpdateTransactionDto) {
    await this.transactionRepository.update(id, updateTransactionDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const transaction = await this.findOne(id);
    if (transaction) {
      await this.transactionRepository.remove(transaction);
    }
    return transaction;
  }

  async uploadTransactionFiles(
    transactionId: string,
    files: Express.Multer.File[],
  ) {
    const tx = await this.transactionRepository.findOneBy({
      id: transactionId,
    });

    if (!tx) {
      throw new NotFoundException('Transacción no encontrada');
    }

    const documents: Document[] = [];

    for (const file of files) {
      // Subir a S3
      const result = await this.s3Service.upload(
        `transactions/${transactionId}`,
        file,
      );

      // Crear entidad Document
      const document = this.documentRepository.create({
        name: file.originalname,
        size: file.size,
        bucket: result.bucket,
        keyS3: result.key,
        module: 'transactions',
        refId: transactionId.toString(),
      });

      documents.push(document);
    }

    // Guardar documentos en BD
    await this.documentRepository.save(documents);

    return {
      transactionId,
      documents,
    };
  }

  async listTransactionDocuments(transactionId: string) {
    const documents = await this.documentRepository.find({
      where: {
        module: 'transactions',
        refId: transactionId.toString(),
      },
      order: {
        createdAt: 'DESC',
      },
    });

    return Promise.all(
      documents.map(async (doc) => ({
        id: doc.id,
        name: doc.name,
        size: Number(doc.size),
        url: await this.s3Service.getPresignedUrl(
          doc.keyS3,
          3600, // 1 hora
        ),
      })),
    );
  }
}
