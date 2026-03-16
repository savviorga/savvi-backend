import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Debt } from './entities/debt.entity';
import { DebtPayment } from './entities/debt-payment.entity';
import { CreateDebtDto } from './dto/create-debt.dto';
import { UpdateDebtDto } from './dto/update-debt.dto';
import { RegisterPaymentDto } from './dto/register-payment.dto';
import { TransactionsService } from '../transactions/services/transactions.service';

@Injectable()
export class PaymentPlannerService {
  constructor(
    @InjectRepository(Debt)
    private readonly debtRepository: Repository<Debt>,
    @InjectRepository(DebtPayment)
    private readonly debtPaymentRepository: Repository<DebtPayment>,
    private readonly transactionsService: TransactionsService,
  ) {}

  async create(createDebtDto: CreateDebtDto): Promise<Debt> {
    const total = Number(createDebtDto.totalAmount);
    const debt = this.debtRepository.create({
      name: createDebtDto.name,
      payee: createDebtDto.payee,
      totalAmount: total,
      remainingAmount: total,
      dueDate: new Date(createDebtDto.dueDate),
      notes: createDebtDto.notes ?? null,
      isRecurring: createDebtDto.isRecurring ?? false,
      recurrenceType: createDebtDto.isRecurring ? (createDebtDto.recurrenceType ?? null) : null,
      recurrenceDay: createDebtDto.isRecurring ? (createDebtDto.recurrenceDay ?? null) : null,
      status: 'pending',
    });
    return this.debtRepository.save(debt);
  }

  findAll(): Promise<Debt[]> {
    return this.debtRepository.find({
      relations: ['payments'],
      order: { dueDate: 'ASC', createdAt: 'DESC' },
    });
  }

  findPending(): Promise<Debt[]> {
    return this.debtRepository.find({
      where: { status: 'pending' },
      relations: ['payments'],
      order: { dueDate: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Debt> {
    const debt = await this.debtRepository.findOne({
      where: { id },
      relations: ['payments'],
    });
    if (!debt) {
      throw new NotFoundException('Deuda no encontrada');
    }
    return debt;
  }

  async update(id: string, updateDebtDto: UpdateDebtDto): Promise<Debt> {
    const debt = await this.findOne(id);
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
    if (updateDebtDto.isRecurring !== undefined) {
      debt.isRecurring = updateDebtDto.isRecurring;
      if (!updateDebtDto.isRecurring) {
        debt.recurrenceType = null;
        debt.recurrenceDay = null;
      }
    }
    if (updateDebtDto.recurrenceType !== undefined) debt.recurrenceType = updateDebtDto.recurrenceType ?? null;
    if (updateDebtDto.recurrenceDay !== undefined) debt.recurrenceDay = updateDebtDto.recurrenceDay ?? null;
    return this.debtRepository.save(debt);
  }

  async remove(id: string): Promise<Debt> {
    const debt = await this.findOne(id);
    await this.debtRepository.remove(debt);
    return debt;
  }

  async registerPayment(
    debtId: string,
    dto: RegisterPaymentDto,
  ): Promise<{ debt: Debt; payment: DebtPayment; transaction: unknown }> {
    const debt = await this.findOne(debtId);
    if (debt.status === 'paid') {
      throw new BadRequestException('Esta deuda ya está pagada');
    }
    const remaining = Number(debt.remainingAmount);
    const amount = Number(dto.amount);
    if (amount > remaining) {
      throw new BadRequestException(
        `El monto no puede ser mayor al pendiente (${remaining})`,
      );
    }
    const paidAt = dto.paidAt ? new Date(dto.paidAt) : new Date();
    const paidAtStr = paidAt.toISOString().slice(0, 10);

    const description =
      dto.description ||
      `Pago planificador: ${debt.name} - ${debt.payee}`;

    const transaction = await this.transactionsService.create({
      date: paidAtStr,
      type: 'egreso',
      amount,
      category: dto.category,
      account: dto.account,
      description,
    });

    const payment = this.debtPaymentRepository.create({
      debtId,
      amount,
      paidAt,
      transactionId: (transaction as { id: string }).id,
    });
    const savedPayment = await this.debtPaymentRepository.save(payment);

    const newRemaining = remaining - amount;
    const newStatus = newRemaining <= 0 ? 'paid' : 'pending';
    await this.debtRepository.update(debtId, {
      remainingAmount: newRemaining,
      status: newStatus,
    });

    const updatedDebt = await this.findOne(debtId);
    return {
      debt: updatedDebt,
      payment: savedPayment,
      transaction,
    };
  }

  /** Total pagado en todas las deudas (historial) */
  async getTotalPaid(): Promise<number> {
    const result = await this.debtPaymentRepository
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.amount), 0)', 'total')
      .getRawOne<{ total: string }>();
    return Number(result?.total ?? 0);
  }
}
