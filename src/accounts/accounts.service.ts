import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CreateAccountDto } from "./dto/create-account.dto";
import { UpdateAccountDto } from "./dto/update-account.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Account } from "./entities/account.entity";

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
  ) {}

  async create(
    userId: string,
    createAccountDto: CreateAccountDto,
  ): Promise<Account> {
    const { initialBalance, ...rest } = createAccountDto;
    const account = this.accountRepository.create({
      ...rest,
      userId,
      balance: initialBalance ?? 0,
    });
    return this.accountRepository.save(account);
  }

  findAll(userId: string): Promise<Account[]> {
    return this.accountRepository.find({
      where: { userId },
      order: { name: "ASC" },
    });
  }

  async findOne(userId: string, id: string): Promise<Account> {
    const account = await this.accountRepository.findOne({
      where: { id, userId },
    });
    if (!account) {
      throw new NotFoundException("Cuenta no encontrada");
    }
    return account;
  }

  async update(
    userId: string,
    id: string,
    updateAccountDto: UpdateAccountDto,
  ): Promise<Account> {
    const account = await this.findOne(userId, id);
    const { initialBalance, ...rest } = updateAccountDto;
    Object.assign(account, rest);
    if (initialBalance !== undefined) {
      account.balance = initialBalance;
    }
    return this.accountRepository.save(account);
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.findOne(userId, id);
    await this.accountRepository.delete({ id, userId });
  }

  /** Comprueba que la cuenta exista y pertenezca al usuario (p. ej. plantillas de transferencia). */
  async assertOwnedByUser(userId: string, accountId: string): Promise<void> {
    const ok = await this.accountRepository.exist({
      where: { id: accountId, userId },
    });
    if (!ok) {
      throw new NotFoundException("Cuenta no encontrada o no pertenece al usuario");
    }
  }
}
