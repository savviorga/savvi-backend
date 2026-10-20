import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Debt } from './entities/debt.entity';
import { DebtPayment } from './entities/debt-payment.entity';
import { CreateDebtDto } from './dto/create-debt.dto';
import { UpdateDebtDto } from './dto/update-debt.dto';
import { RegisterPaymentDto } from './dto/register-payment.dto';
import { TransactionsService } from '../transactions/services/transactions.service';
import { AccountsService } from '../accounts/accounts.service';
import { todayInBogota } from '../common/bogota-time';

@Injectable()
export class PaymentPlannerService {
  constructor(
    @InjectRepository(Debt)
    private readonly debtRepository: Repository<Debt>,
    @InjectRepository(DebtPayment)
    private readonly debtPaymentRepository: Repository<DebtPayment>,
    private readonly transactionsService: TransactionsService,
    private readonly accountsService: AccountsService,
    private readonly dataSource: DataSource,
  ) {}

  async create(userId: string, createDebtDto: CreateDebtDto): Promise<Debt> {
    if (createDebtDto.accountId) {
      await this.accountsService.assertOwnedByUser(
        userId,
        createDebtDto.accountId,
      );
    }
    const total = Number(createDebtDto.totalAmount);
    const debt = this.debtRepository.create({
      userId,
      name: createDebtDto.name,
      payee: createDebtDto.payee,
      totalAmount: total,
      remainingAmount: total,
      dueDate: new Date(createDebtDto.dueDate),
      accountId: createDebtDto.accountId,
      notes: createDebtDto.notes ?? null,
      isRecurring: createDebtDto.isRecurring ?? false,
      recurrenceType: createDebtDto.isRecurring
        ? (createDebtDto.recurrenceType ?? null)
        : null,
      recurrenceDay: createDebtDto.isRecurring
        ? (createDebtDto.recurrenceDay ?? null)
        : null,
      status: 'pending',
    });
    return this.debtRepository.save(debt);
  }

  findAll(userId: string): Promise<Debt[]> {
    return this.debtRepository.find({
      where: { userId },
      relations: ['payments'],
      order: { dueDate: 'ASC', createdAt: 'DESC' },
    });
  }

  findPending(userId: string): Promise<Debt[]> {
    return this.debtRepository.find({
      where: { userId, status: 'pending' },
      relations: ['payments'],
      order: { dueDate: 'ASC' },
    });
  }

  async findOne(userId: string, id: string): Promise<Debt> {
    const debt = await this.debtRepository.findOne({
      where: { id, userId },
      relations: ['payments'],
    });
    if (!debt) {
      throw new NotFoundException('Deuda no encontrada');
    }
    return debt;
  }

  async update(
    userId: string,
    id: string,
    updateDebtDto: UpdateDebtDto,
  ): Promise<Debt> {
    const debt = await this.findOne(userId, id);
    if (updateDebtDto.accountId) {
      await this.accountsService.assertOwnedByUser(
        userId,
        updateDebtDto.accountId,
      );
    }
    if (debt.status === 'paid') {
      throw new BadRequestException('No se puede editar una deuda ya pagada');
    }
    if (updateDebtDto.totalAmount != null) {
      const total = Number(updateDebtDto.totalAmount);
      const remaining = Number(debt.remainingAmount);
      if (total < remaining) {
        throw new BadRequestException(
          'El monto total no puede ser menor al pendiente por pagar',
        );
      }
      debt.totalAmount = total;
    }
    if (updateDebtDto.payee != null) debt.payee = updateDebtDto.payee;
    if (updateDebtDto.name != null) debt.name = updateDebtDto.name;
    if (updateDebtDto.dueDate != null)
      debt.dueDate = new Date(updateDebtDto.dueDate);
    if (updateDebtDto.notes !== undefined) debt.notes = updateDebtDto.notes;
    if (updateDebtDto.accountId !== undefined)
      debt.accountId = updateDebtDto.accountId;
    if (updateDebtDto.isRecurring !== undefined) {
      debt.isRecurring = updateDebtDto.isRecurring;
      if (!updateDebtDto.isRecurring) {
        debt.recurrenceType = null;
        debt.recurrenceDay = null;
      }
    }
    if (updateDebtDto.recurrenceType !== undefined)
      debt.recurrenceType = updateDebtDto.recurrenceType ?? null;
    if (updateDebtDto.recurrenceDay !== undefined)
      debt.recurrenceDay = updateDebtDto.recurrenceDay ?? null;
    return this.debtRepository.save(debt);
  }

  async remove(userId: string, id: string): Promise<Debt> {
    const debt = await this.findOne(userId, id);
    await this.debtRepository.remove(debt);
    return debt;
  }

  /**
   * Registra un abono: crea la transacción del pago, el abono y el nuevo saldo
   * de la deuda en una sola transacción de base de datos. La deuda queda
   * bloqueada (FOR UPDATE) mientras tanto, así dos abonos simultáneos no pueden
   * pasar la validación con el mismo saldo.
   */
  async registerPayment(
    userId: string,
    debtId: string,
    dto: RegisterPaymentDto,
  ): Promise<{ debt: Debt; payment: DebtPayment; transaction: unknown }> {
    // Sin fecha, el abono es de hoy en Colombia (no en UTC del servidor).
    const paidAtStr = dto.paidAt ? dto.paidAt.slice(0, 10) : todayInBogota();
    const amount = Number(dto.amount);

    const { payment, transaction } = await this.dataSource.transaction(
      async (manager) => {
        const debt = await manager
          .getRepository(Debt)
          .createQueryBuilder('d')
          .setLock('pessimistic_write')
          .where('d.id = :debtId AND d.userId = :userId', { debtId, userId })
          .getOne();
        if (!debt) {
          throw new NotFoundException('Deuda no encontrada');
        }
        if (debt.status === 'paid') {
          throw new BadRequestException('Esta deuda ya está pagada');
        }
        const remaining = Number(debt.remainingAmount);
        if (amount > remaining) {
          throw new BadRequestException(
            `El monto no puede ser mayor al pendiente (${remaining})`,
          );
        }

        const created = await this.transactionsService.create(
          userId,
          {
            date: paidAtStr,
            type: 'egreso',
            amount,
            categoryId: dto.categoryId,
            account: dto.account,
            description:
              dto.description ||
              `Pago planificador: ${debt.name} - ${debt.payee}`,
          },
          manager,
        );

        const saved = await manager.save(
          manager.create(DebtPayment, {
            debtId,
            amount,
            paidAt: paidAtStr as unknown as Date,
            transactionId: created.id,
          }),
        );

        const newRemaining = Math.max(
          0,
          Math.round((remaining - amount) * 100) / 100,
        );
        await manager.update(
          Debt,
          { id: debtId, userId },
          {
            remainingAmount: newRemaining,
            status: newRemaining <= 0 ? 'paid' : 'pending',
          },
        );
        return { payment: saved, transaction: created };
      },
    );

    return {
      debt: await this.findOne(userId, debtId),
      payment,
      transaction,
    };
  }

  /** Total pagado en deudas del usuario (historial de pagos del planificador). */
  async getTotalPaid(userId: string): Promise<number> {
    const result = await this.debtPaymentRepository
      .createQueryBuilder('p')
      .innerJoin('p.debt', 'd')
      .where('d.userId = :userId', { userId })
      .select('COALESCE(SUM(p.amount), 0)', 'total')
      .getRawOne<{ total: string }>();
    return Number(result?.total ?? 0);
  }
}
