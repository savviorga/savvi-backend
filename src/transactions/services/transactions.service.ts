import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateTransactionDto } from "../dto/create-transaction.dto";
import { UpdateTransactionDto } from "../dto/update-transaction.dto";
import { UploadedFileMetadataDto } from "../dto/confirm-upload.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Transaction } from "../entities/transaction.entity";
import { Document } from "../entities/document.entity";
import { S3Service } from "../../s3/s3.service";
import { bucket } from "../../infrastructure/config/s3.config";

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
    userId: string,
    createTransactionDto: CreateTransactionDto,
  ): Promise<Transaction> {
    const transaction = this.transactionRepository.create({
      ...createTransactionDto,
      userId,
    });
    return await this.transactionRepository.save(transaction);
  }

  async createBulk(
    userId: string,
    createTransactionsDto: CreateTransactionDto[],
  ) {
    const transactions = this.transactionRepository.create(
      createTransactionsDto.map((row) => ({ ...row, userId })),
    );
    const saved = await this.transactionRepository.save(transactions);

    return {
      count: saved.length,
      data: saved,
    };
  }

  findAll(userId: string) {
    return this.transactionRepository.find({
      where: { userId },
      order: { date: "DESC", id: "DESC" },
    });
  }

  async findOne(userId: string, id: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id, userId },
    });
    if (!transaction) {
      throw new NotFoundException("Transacción no encontrada");
    }
    return transaction;
  }

  async update(
    userId: string,
    id: string,
    updateTransactionDto: UpdateTransactionDto,
  ) {
    await this.findOne(userId, id);
    await this.transactionRepository.update({ id, userId }, updateTransactionDto);
    return this.findOne(userId, id);
  }

  async remove(userId: string, id: string) {
    const transaction = await this.findOne(userId, id);
    await this.transactionRepository.remove(transaction);
    return transaction;
  }

  async uploadTransactionFiles(
    userId: string,
    transactionId: string,
    files: Express.Multer.File[],
  ) {
    const tx = await this.findOne(userId, transactionId);

    const documents: Document[] = [];

    for (const file of files) {
      const result = await this.s3Service.upload(
        `transactions/${transactionId}`,
        file,
      );

      const document = this.documentRepository.create({
        name: file.originalname,
        size: file.size,
        bucket: result.bucket,
        keyS3: result.key,
        module: "transactions",
        refId: tx.id.toString(),
      });

      documents.push(document);
    }

    await this.documentRepository.save(documents);

    return {
      transactionId,
      documents,
    };
  }

  async confirmUploadedFiles(
    userId: string,
    transactionId: string,
    files: UploadedFileMetadataDto[],
  ) {
    const tx = await this.findOne(userId, transactionId);

    const documents = files.map((f) =>
      this.documentRepository.create({
        name: f.name,
        size: f.size,
        bucket,
        keyS3: f.key,
        module: 'transactions',
        refId: tx.id.toString(),
      }),
    );

    await this.documentRepository.save(documents);

    return { transactionId, documents };
  }

  async listTransactionDocuments(userId: string, transactionId: string) {
    await this.findOne(userId, transactionId);

    const documents = await this.documentRepository.find({
      where: {
        module: "transactions",
        refId: transactionId.toString(),
      },
      order: {
        createdAt: "DESC",
      },
    });

    return Promise.all(
      documents.map(async (doc) => ({
        id: doc.id,
        name: doc.name,
        size: Number(doc.size),
        url: await this.s3Service.getPresignedUrl(
          doc.keyS3,
          3600,
        ),
      })),
    );
  }
}
