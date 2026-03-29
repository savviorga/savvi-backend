import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QueryFailedError } from 'typeorm';
import { WaitingList } from './entities/waiting-list.entity';
import { CreateWaitingListDto } from './dto/create-waiting-list.dto';

function isPgUniqueViolation(err: QueryFailedError): boolean {
  const driver = (err as QueryFailedError & { driverError?: { code?: string } })
    .driverError;
  const code =
    (err as QueryFailedError & { code?: string }).code ?? driver?.code;
  return code === '23505';
}

@Injectable()
export class WaitingListService {
  constructor(
    @InjectRepository(WaitingList)
    private readonly waitingListRepository: Repository<WaitingList>,
  ) {}

  async create(dto: CreateWaitingListDto) {
    const row = this.waitingListRepository.create({
      email: dto.email.trim().toLowerCase(),
      description: dto.description?.trim() || null,
    });
    try {
      return await this.waitingListRepository.save(row);
    } catch (err) {
      if (err instanceof QueryFailedError && isPgUniqueViolation(err)) {
        throw new ConflictException(
          'Este email ya está registrado en la lista de espera.',
        );
      }
      throw err;
    }
  }
}
