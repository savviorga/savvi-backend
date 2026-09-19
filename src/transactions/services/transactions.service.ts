import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { UpdateTransactionDto } from '../dto/update-transaction.dto';
import { UploadedFileMetadataDto } from '../dto/confirm-upload.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Transaction } from '../entities/transaction.entity';
import { Document } from '../entities/document.entity';
import { S3Service } from '../../s3/s3.service';
import { bucket } from '../../infrastructure/config/s3.config';

const DOCUMENT_MODULE = 'transactions';

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
      order: { date: 'DESC', id: 'DESC' },
    });
  }

  async findOne(userId: string, id: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id, userId },
    });
    if (!transaction) {
      throw new NotFoundException('Transacción no encontrada');
    }
    return transaction;
  }

  /**
   * Edita una transacción: campos, eliminación de adjuntos y vinculación de
   * nuevos archivos (ya subidos a S3 con URL prefirmada) en una sola petición.
   */
  async update(
    userId: string,
    id: string,
    updateTransactionDto: UpdateTransactionDto,
  ) {
    await this.findOne(userId, id);

    const { documentsToDelete, filesToAdd, ...fields } = updateTransactionDto;

    if (Object.keys(fields).length > 0) {
      await this.transactionRepository.update({ id, userId }, fields);
    }

    if (documentsToDelete?.length) {
      await this.removeDocuments(userId, id, documentsToDelete);
    }

    if (filesToAdd?.length) {
      await this.confirmUploadedFiles(userId, id, filesToAdd);
    }

    return this.findOneWithDocuments(userId, id);
  }

  /**
   * Devuelve la transacción junto con sus documentos y URLs prefirmadas.
   */
  async findOneWithDocuments(userId: string, id: string) {
    const transaction = await this.findOne(userId, id);
    const documents = await this.buildDocumentsResponse(id);

    return { ...transaction, documents };
  }

  async remove(userId: string, id: string) {
    const transaction = await this.findOne(userId, id);

    const documents = await this.documentRepository.find({
      where: { module: DOCUMENT_MODULE, refId: id },
    });

    if (documents.length) {
      await this.s3Service.deleteFiles(documents.map((doc) => doc.keyS3));
      await this.documentRepository.remove(documents);
    }

    const removed = { ...transaction };
    await this.transactionRepository.remove(transaction);

    return { ...removed, deletedDocuments: documents.length };
  }

  async uploadTransactionFiles(
    userId: string,
    transactionId: string,
    files: Express.Multer.File[],
  ) {
    const tx = await this.findOne(userId, transactionId);

    const documents: Document[] = [];

    for (const file of files) {
      // Nombre único en S3: evita sobrescribir un adjunto previo con el mismo
      // nombre y mantiene la key 1 a 1 con el documento.
      const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;

      const result = await this.s3Service.upload(
        `transactions/${transactionId}`,
        { ...file, originalname: uniqueName },
      );

      const document = this.documentRepository.create({
        name: file.originalname,
        size: file.size,
        bucket: result.bucket,
        keyS3: result.key,
        module: DOCUMENT_MODULE,
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
        module: DOCUMENT_MODULE,
        refId: tx.id.toString(),
      }),
    );

    await this.documentRepository.save(documents);

    return { transactionId, documents };
  }

  async listTransactionDocuments(userId: string, transactionId: string) {
    await this.findOne(userId, transactionId);

    return this.buildDocumentsResponse(transactionId);
  }

  /**
   * Elimina un adjunto de la transacción: lo borra de S3 y de la base de datos.
   */
  async removeDocument(
    userId: string,
    transactionId: string,
    documentId: string,
  ) {
    await this.findOne(userId, transactionId);

    const document = await this.documentRepository.findOne({
      where: {
        id: documentId,
        module: DOCUMENT_MODULE,
        refId: transactionId,
      },
    });

    if (!document) {
      throw new NotFoundException(
        'Documento no encontrado para esta transacción',
      );
    }

    await this.s3Service.deleteFile(document.keyS3);
    await this.documentRepository.remove(document);

    return {
      transactionId,
      documentId,
      name: document.name,
      deleted: true,
    };
  }

  /**
   * Elimina varios adjuntos de la transacción en una sola operación.
   */
  async removeDocuments(
    userId: string,
    transactionId: string,
    documentIds: string[],
  ) {
    await this.findOne(userId, transactionId);

    const uniqueIds = [...new Set(documentIds)];

    const documents = await this.documentRepository.find({
      where: {
        id: In(uniqueIds),
        module: DOCUMENT_MODULE,
        refId: transactionId,
      },
    });

    if (documents.length !== uniqueIds.length) {
      const found = new Set(documents.map((doc) => doc.id));
      const missing = uniqueIds.filter((id) => !found.has(id));
      throw new NotFoundException(
        `Documentos no encontrados para esta transacción: ${missing.join(', ')}`,
      );
    }

    await this.s3Service.deleteFiles(documents.map((doc) => doc.keyS3));
    await this.documentRepository.remove(documents);

    return {
      transactionId,
      deleted: uniqueIds,
      count: uniqueIds.length,
    };
  }

  private async buildDocumentsResponse(transactionId: string) {
    const documents = await this.documentRepository.find({
      where: {
        module: DOCUMENT_MODULE,
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
        url: await this.s3Service.getPresignedUrl(doc.keyS3, 3600),
      })),
    );
  }
}
