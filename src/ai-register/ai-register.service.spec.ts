import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AiRegisterService } from './ai-register.service';
import { AiRegisterJob } from './entities/ai-register-job.entity';

describe('AiRegisterService', () => {
  let service: AiRegisterService;
  let repo: Partial<Repository<AiRegisterJob>>;
  let transactionsService: { create: jest.Mock };
  let s3Service: { listFiles: jest.Mock };

  beforeEach(() => {
    repo = {
      create: jest.fn((value) => value as AiRegisterJob),
      save: jest.fn(async (value) => ({
        id: 'job-1',
        status: 'queued',
        ...value,
      })),
      findOne: jest.fn(async () => null),
      update: jest.fn(async () => ({ affected: 1 })),
    };
    transactionsService = { create: jest.fn() };
    s3Service = { listFiles: jest.fn(async () => ['savvi-ia/factura-1.jpg']) };

    service = new AiRegisterService(
      repo as Repository<AiRegisterJob>,
      transactionsService as never,
      s3Service as never,
    );
  });

  it('creates a queued job and triggers processing', async () => {
    const processSpy = jest
      .spyOn(service as any, 'processJob')
      .mockResolvedValue(undefined);

    const response = await service.createJob('user-1', {
      key: 'savvi-ia/factura-1.jpg',
      name: 'factura-1.jpg',
      size: 1000,
      mimeType: 'image/jpeg',
      userText: 'compra supermercado 120000',
    });

    expect(response.status).toBe('queued');
    expect(processSpy).toHaveBeenCalledWith('job-1');
    expect(repo.save).toHaveBeenCalled();
  });

  it('fails when mime type is not supported', async () => {
    await expect(
      service.createJob('user-1', {
        key: 'savvi-ia/factura-1.jpg',
        name: 'factura-1.jpg',
        size: 1000,
        mimeType: 'application/zip',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
