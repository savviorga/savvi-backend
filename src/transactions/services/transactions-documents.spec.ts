import { BadRequestException } from '@nestjs/common';
import { TransactionsService } from './transactions.service';

/** Adjuntos: solo se aceptan, firman y borran archivos del propio usuario. */
describe('TransactionsService – documentos', () => {
  const userId = 'user-1';
  const txId = 'tx-1';

  let service: TransactionsService;
  let transactionRepository: { findOne: jest.Mock };
  let documentRepository: {
    count: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    remove: jest.Mock;
  };
  let s3Service: {
    getObjectInfo: jest.Mock;
    getDownloadUrl: jest.Mock;
    deleteFiles: jest.Mock;
  };

  beforeEach(() => {
    transactionRepository = {
      findOne: jest.fn().mockResolvedValue({ id: txId, userId }),
    };
    documentRepository = {
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn((value: unknown) => value),
      save: jest.fn((value: unknown) => Promise.resolve(value)),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      remove: jest.fn().mockResolvedValue(undefined),
    };
    s3Service = {
      getObjectInfo: jest
        .fn()
        .mockResolvedValue({ size: 2048, contentType: 'application/pdf' }),
      getDownloadUrl: jest.fn().mockResolvedValue('https://signed'),
      deleteFiles: jest.fn().mockResolvedValue(undefined),
    };
    service = new TransactionsService(
      transactionRepository as never,
      documentRepository as never,
      {} as never,
      s3Service as never,
    );
  });

  it('acepta una key del usuario y toma el tamaño real de S3', async () => {
    const key = `users/${userId}/transactions/abc-factura.pdf`;
    const result = await service.confirmUploadedFiles(userId, txId, [
      { key, name: 'factura.pdf', size: 1 },
    ]);
    expect(result.documents[0]).toMatchObject({ keyS3: key, size: 2048 });
  });

  it('rechaza keys de otro usuario o sin prefijo', async () => {
    for (const key of [
      'users/otro/transactions/abc-factura.pdf',
      'transactions/tx-9/1714-factura.pdf',
      'savvi-ia/123-recibo.jpg',
    ]) {
      await expect(
        service.confirmUploadedFiles(userId, txId, [
          { key, name: 'x.pdf', size: 10 },
        ]),
      ).rejects.toBeInstanceOf(BadRequestException);
    }
    expect(documentRepository.save).not.toHaveBeenCalled();
  });

  it('rechaza archivos que no existen en S3', async () => {
    s3Service.getObjectInfo.mockResolvedValue(null);
    await expect(
      service.confirmUploadedFiles(userId, txId, [
        {
          key: `users/${userId}/transactions/abc-x.pdf`,
          name: 'x.pdf',
          size: 10,
        },
      ]),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('no borra de S3 objetos de otro usuario ni keys antiguas compartidas', async () => {
    const own = { id: 'd1', keyS3: `users/${userId}/transactions/a.pdf` };
    const foreign = { id: 'd2', keyS3: 'users/otro/transactions/b.pdf' };
    const legacyShared = { id: 'd3', keyS3: 'transactions/tx-9/c.pdf' };
    documentRepository.find.mockResolvedValue([own, foreign, legacyShared]);
    documentRepository.count.mockResolvedValue(2);

    await service.removeDocuments(userId, txId, ['d1', 'd2', 'd3']);

    expect(s3Service.deleteFiles).toHaveBeenCalledWith([own.keyS3]);
  });
});
