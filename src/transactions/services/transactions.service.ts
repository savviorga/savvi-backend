import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { UpdateTransactionDto } from '../dto/update-transaction.dto';
import { UploadedFileMetadataDto } from '../dto/confirm-upload.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Transaction } from '../entities/transaction.entity';
import { Document } from '../entities/document.entity';
import { Category } from '../../categories/entities/category.entity';
import { Account } from '../../accounts/entities/account.entity';
import { S3Service } from '../../s3/s3.service';
import { bucket } from '../../infrastructure/config/s3.config';
import { isUserKey, sanitizeFileName } from '../../s3/s3-keys';
import { randomUUID } from 'crypto';

const DOCUMENT_MODULE = 'transactions';
/** Tope por petición de `POST /transactions/bulk`: el cliente envía lotes más pequeños en cola. */
const MAX_BULK_ITEMS = 200;

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly s3Service: S3Service,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
  ) {}

  async create(
    userId: string,
    createTransactionDto: CreateTransactionDto,
  ): Promise<Transaction> {
    const [category] = await this.findUserCategories(userId, [
      createTransactionDto.categoryId,
    ]);
    assertCategoryMatchesType(category, createTransactionDto.type);
    await this.assertUserAccounts(userId, [createTransactionDto.account]);
    const transaction = this.transactionRepository.create({
      ...createTransactionDto,
      userId,
      legacyCategoryName: category.name,
    });
    const saved = await this.transactionRepository.save(transaction);
    return this.findOne(userId, saved.id);
  }

  /**
   * Categoría del usuario con ese nombre y tipo; si no existe, la crea. Para
   * los registros automáticos (pagos recurrentes, IA) que no eligen una.
   */
  async findOrCreateCategory(
    userId: string,
    name: string,
    type: 'ingreso' | 'egreso',
  ): Promise<Category> {
    const existing = await this.categoryRepository
      .createQueryBuilder('c')
      .where('c.userId = :userId', { userId })
      .andWhere('LOWER(TRIM(c.name)) = LOWER(TRIM(:name))', { name })
      .andWhere('c.type = :type', { type })
      .orderBy('c.isActive', 'DESC')
      .addOrderBy('c.createdAt', 'ASC')
      .getOne();
    if (existing) return existing;

    return this.categoryRepository.save(
      this.categoryRepository.create({ userId, name, type }),
    );
  }

  /** Valida que las categorías existan y sean del usuario; las devuelve en el mismo orden. */
  private async findUserCategories(
    userId: string,
    categoryIds: string[],
  ): Promise<Category[]> {
    const uniqueIds = [...new Set(categoryIds)];
    const found = await this.categoryRepository.find({
      where: { id: In(uniqueIds), userId },
    });
    const byId = new Map(found.map((category) => [category.id, category]));
    if (byId.size !== uniqueIds.length) {
      throw new BadRequestException('La categoría no existe');
    }
    return categoryIds.map((id) => byId.get(id)!);
  }

  /** Valida que las cuentas existan y sean del usuario. */
  private async assertUserAccounts(
    userId: string,
    accountIds: string[],
  ): Promise<void> {
    const uniqueIds = [...new Set(accountIds)];
    const found = await this.accountRepository.count({
      where: { id: In(uniqueIds), userId },
    });
    if (found !== uniqueIds.length) {
      throw new BadRequestException('La cuenta no existe');
    }
  }

  async createBulk(
    userId: string,
    createTransactionsDto: CreateTransactionDto[],
  ) {
    if (createTransactionsDto.length === 0) {
      throw new BadRequestException('Envía al menos una transacción');
    }
    if (createTransactionsDto.length > MAX_BULK_ITEMS) {
      throw new BadRequestException(
        `Máximo ${MAX_BULK_ITEMS} transacciones por petición`,
      );
    }
    const categories = await this.findUserCategories(
      userId,
      createTransactionsDto.map((row) => row.categoryId),
    );
    createTransactionsDto.forEach((row, i) =>
      assertCategoryMatchesType(categories[i], row.type, i + 1),
    );
    await this.assertUserAccounts(
      userId,
      createTransactionsDto.map((row) => row.account),
    );
    // `save` con un arreglo usa una sola transacción: se guardan todas o ninguna.
    const transactions = this.transactionRepository.create(
      createTransactionsDto.map((row, i) => ({
        ...row,
        userId,
        legacyCategoryName: categories[i].name,
      })),
    );
    const saved = await this.transactionRepository.save(transactions);

    return {
      count: saved.length,
      data: saved,
    };
  }

  /**
   * Listado del usuario con `documentsCount` por transacción, para que el front
   * marque las que tienen adjuntos sin pedir los documentos de cada una.
   */
  async findAll(userId: string) {
    const [transactions, counts] = await Promise.all([
      this.transactionRepository.find({
        where: { userId },
        relations: { category: { parent: true } },
        order: { date: 'DESC', id: 'DESC' },
      }),
      this.documentRepository
        .createQueryBuilder('document')
        .innerJoin(
          Transaction,
          'transaction',
          'CAST(transaction.id AS text) = document.refId',
        )
        .select('document.refId', 'refId')
        .addSelect('COUNT(*)', 'count')
        .where('document.module = :module', { module: DOCUMENT_MODULE })
        .andWhere('transaction.userId = :userId', { userId })
        .groupBy('document.refId')
        .getRawMany<{ refId: string; count: string }>(),
    ]);

    const countByTransaction = new Map(
      counts.map((row) => [row.refId, Number(row.count)]),
    );

    return transactions.map((transaction) => ({
      ...transaction,
      documentsCount: countByTransaction.get(transaction.id) ?? 0,
    }));
  }

  async findOne(userId: string, id: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id, userId },
      relations: { category: { parent: true } },
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
    const current = await this.findOne(userId, id);

    const { documentsToDelete, filesToAdd, ...fields } = updateTransactionDto;

    if (Object.keys(fields).length > 0) {
      const category =
        fields.categoryId !== undefined || fields.type !== undefined
          ? (
              await this.findUserCategories(userId, [
                fields.categoryId ?? current.categoryId,
              ])
            )[0]
          : null;
      if (category) {
        assertCategoryMatchesType(category, fields.type ?? current.type);
      }
      if (fields.account !== undefined) {
        await this.assertUserAccounts(userId, [fields.account]);
      }
      const legacy =
        category && fields.categoryId
          ? { legacyCategoryName: category.name }
          : {};
      // Al elegir una cuenta real, el texto viejo deja de aplicar.
      const legacyAccount =
        fields.account !== undefined ? { legacyAccount: null } : {};
      await this.transactionRepository.update(
        { id, userId },
        { ...fields, ...legacy, ...legacyAccount },
      );
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
    const documents = await this.buildDocumentsResponse(userId, id);

    return { ...transaction, documents };
  }

  async remove(userId: string, id: string) {
    const transaction = await this.findOne(userId, id);

    const documents = await this.documentRepository.find({
      where: { module: DOCUMENT_MODULE, refId: id },
    });

    if (documents.length) {
      await this.deleteDocumentObjects(userId, documents);
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
      // Nombre único dentro del prefijo del usuario: evita sobrescribir un
      // adjunto previo y mantiene la key 1 a 1 con el documento.
      const uniqueName = `${randomUUID()}-${sanitizeFileName(file.originalname)}`;

      const result = await this.s3Service.upload(
        `users/${userId}/transactions`,
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

  /**
   * Registra archivos que el cliente ya subió a S3 con una URL prefirmada.
   * Solo acepta keys del propio usuario (las genera `POST /s3/presigned-url`)
   * que existan en el bucket; el tamaño se toma de S3, no del cliente.
   */
  async confirmUploadedFiles(
    userId: string,
    transactionId: string,
    files: UploadedFileMetadataDto[],
  ) {
    const tx = await this.findOne(userId, transactionId);

    const keys = [...new Set(files.map((f) => f.key))];
    if (keys.length !== files.length) {
      throw new BadRequestException('Hay archivos repetidos en la petición');
    }
    for (const key of keys) {
      if (!isUserKey(userId, key, DOCUMENT_MODULE)) {
        throw new BadRequestException(
          'El archivo no pertenece a tu cuenta. Súbelo de nuevo.',
        );
      }
    }

    const alreadyLinked = await this.documentRepository.count({
      where: { keyS3: In(keys) },
    });
    if (alreadyLinked > 0) {
      throw new BadRequestException('El archivo ya está adjunto');
    }

    const documents = await Promise.all(
      files.map(async (f) => {
        const info = await this.s3Service.getObjectInfo(f.key);
        if (!info) {
          throw new BadRequestException(
            `El archivo ${f.name} no se encontró en el almacenamiento. Súbelo de nuevo.`,
          );
        }
        return this.documentRepository.create({
          name: f.name,
          size: info.size || f.size,
          bucket,
          keyS3: f.key,
          module: DOCUMENT_MODULE,
          refId: tx.id.toString(),
        });
      }),
    );

    await this.documentRepository.save(documents);

    return { transactionId, documents };
  }

  async listTransactionDocuments(userId: string, transactionId: string) {
    await this.findOne(userId, transactionId);

    return this.buildDocumentsResponse(userId, transactionId);
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

    await this.deleteDocumentObjects(userId, [document]);
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

    await this.deleteDocumentObjects(userId, documents);
    await this.documentRepository.remove(documents);

    return {
      transactionId,
      deleted: uniqueIds,
      count: uniqueIds.length,
    };
  }

  /**
   * Borra de S3 los objetos de los documentos, pero nunca uno de otro usuario:
   * se omiten keys de otro prefijo `users/` y las keys antiguas (sin prefijo)
   * que también estén referenciadas por otro documento.
   */
  private async deleteDocumentObjects(userId: string, documents: Document[]) {
    const keys: string[] = [];
    for (const doc of documents) {
      if (doc.keyS3.startsWith('users/')) {
        if (isUserKey(userId, doc.keyS3)) keys.push(doc.keyS3);
        continue;
      }
      const references = await this.documentRepository.count({
        where: { keyS3: doc.keyS3 },
      });
      if (references <= 1) keys.push(doc.keyS3);
    }
    await this.s3Service.deleteFiles(keys);
  }

  /** Documentos con URL de descarga; nunca firma keys de otro usuario. */
  private async buildDocumentsResponse(userId: string, transactionId: string) {
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
        url:
          doc.keyS3.startsWith('users/') && !isUserKey(userId, doc.keyS3)
            ? null
            : await this.s3Service.getDownloadUrl(doc.keyS3, 3600),
      })),
    );
  }
}

/**
 * La categoría debe ser del mismo tipo que la transacción (las
 * transferencias aceptan cualquiera).
 */
function assertCategoryMatchesType(
  category: Category,
  type: string,
  row?: number,
): void {
  if (type === 'transferencia' || category.type === type) return;
  const prefix = row ? `Fila ${row}: ` : '';
  throw new BadRequestException(
    `${prefix}la categoría "${category.name}" es de ${category.type === 'ingreso' ? 'ingresos' : 'gastos'} y la transacción es un ${type}.`,
  );
}
