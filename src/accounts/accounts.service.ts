import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from './entities/account.entity';

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
      order: { name: 'ASC' },
    });
  }

  async findOne(userId: string, id: string): Promise<Account> {
    const account = await this.accountRepository.findOne({
      where: { id, userId },
    });
    if (!account) {
      throw new NotFoundException('Cuenta no encontrada');
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

  /**
   * Elimina la cuenta si nada depende de ella. Con transacciones, deudas o
   * pagos recurrentes se responde 409: se puede desactivar en su lugar.
   */
  async remove(userId: string, id: string): Promise<void> {
    await this.findOne(userId, id);

    const [usage] = (await this.accountRepository.query(
      `SELECT
         (SELECT count(*) FROM finance.transactions WHERE account_id = $1 OR to_account_id = $1) AS transactions,
         (SELECT count(*) FROM finance.debts WHERE "accountId" = $1) AS debts,
         (SELECT count(*) FROM finance.transfer_templates WHERE from_account_id = $1) AS templates`,
      [id],
    )) as { transactions: string; debts: string; templates: string }[];
    const parts = [
      [Number(usage.transactions), 'transacción', 'transacciones'],
      [Number(usage.debts), 'deuda', 'deudas'],
      [Number(usage.templates), 'pago recurrente', 'pagos recurrentes'],
    ] as const;
    const used = parts
      .filter(([n]) => n > 0)
      .map(([n, one, many]) => `${n} ${n === 1 ? one : many}`);
    if (used.length) {
      throw new ConflictException(
        `No puedes eliminar esta cuenta: tiene ${used.join(', ')}. Desactívala o mueve esos registros a otra cuenta.`,
      );
    }

    await this.accountRepository.delete({ id, userId });
  }

  /** Comprueba que la cuenta exista y pertenezca al usuario (p. ej. plantillas de transferencia). */
  async assertOwnedByUser(userId: string, accountId: string): Promise<void> {
    const ok = await this.accountRepository.exist({
      where: { id: accountId, userId },
    });
    if (!ok) {
      throw new NotFoundException(
        'Cuenta no encontrada o no pertenece al usuario',
      );
    }
  }
}
