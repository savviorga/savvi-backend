import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../auth/entities/user.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { Document } from '../transactions/entities/document.entity';
import { Account } from '../accounts/entities/account.entity';
import { Category } from '../categories/entities/category.entity';
import { Budget } from '../budgets/entities/budget.entity';
import { Debt } from '../payment-planner/entities/debt.entity';
import { DebtPayment } from '../payment-planner/entities/debt-payment.entity';
import { TransferTemplate } from '../transfer-templates/entities/transfer-template.entity';
import { AiRegisterJob } from '../ai-register/entities/ai-register-job.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

const DOCUMENT_MODULE = 'transactions';
const MONTHLY_SERIES_LENGTH = 12;
const TOP_CATEGORIES_LIMIT = 5;

const toNumber = (value: unknown): number => Number(value ?? 0) || 0;
const round2 = (value: number): number => Math.round(value * 100) / 100;

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Budget)
    private readonly budgetRepository: Repository<Budget>,
    @InjectRepository(Debt)
    private readonly debtRepository: Repository<Debt>,
    @InjectRepository(DebtPayment)
    private readonly debtPaymentRepository: Repository<DebtPayment>,
    @InjectRepository(TransferTemplate)
    private readonly transferTemplateRepository: Repository<TransferTemplate>,
    @InjectRepository(AiRegisterJob)
    private readonly aiRegisterJobRepository: Repository<AiRegisterJob>,
  ) {}

  async getProfile(userId: string) {
    const user = await this.findUser(userId);
    return this.sanitize(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.findUser(userId);

    if (dto.email && dto.email !== user.email) {
      const existing = await this.userRepository.findOne({
        where: { email: dto.email },
      });
      if (existing) {
        throw new ConflictException('Ya existe un usuario con este email');
      }
      user.email = dto.email;
    }
    if (dto.name !== undefined) user.name = dto.name;

    const saved = await this.userRepository.save(user);
    return this.sanitize(saved);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.findUser(userId);

    if (!(await bcrypt.compare(dto.currentPassword, user.password))) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        'La nueva contraseña debe ser distinta de la actual',
      );
    }

    user.password = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepository.save(user);
    return { message: 'Contraseña actualizada correctamente' };
  }

  async getSummary(userId: string) {
    const user = await this.findUser(userId);

    const [
      transactionStats,
      currentMonth,
      monthly,
      topExpenseCategories,
      documents,
      accounts,
      categories,
      budgets,
      debts,
      debtPayments,
      transferTemplates,
      aiJobs,
    ] = await Promise.all([
      this.transactionStats(userId),
      this.currentMonthStats(userId),
      this.monthlySeries(userId),
      this.topExpenseCategories(userId),
      this.documentCount(userId),
      this.accountStats(userId),
      this.categoryStats(userId),
      this.budgetStats(userId),
      this.debtStats(userId),
      this.debtPaymentStats(userId),
      this.transferTemplateStats(userId),
      this.aiJobStats(userId),
    ]);

    const now = new Date();
    const daysActive = Math.max(
      1,
      Math.ceil((now.getTime() - user.createdAt.getTime()) / 86_400_000),
    );
    const activeMonths = Math.max(1, transactionStats.activeMonths);

    return {
      user: this.sanitize(user),
      memberSince: user.createdAt,
      daysActive,
      transactions: {
        count: transactionStats.count,
        incomeCount: transactionStats.incomeCount,
        expenseCount: transactionStats.expenseCount,
        transferCount: transactionStats.transferCount,
        withAttachments: documents.transactionsWithAttachments,
        firstDate: transactionStats.firstDate,
        lastDate: transactionStats.lastDate,
        activeMonths: transactionStats.activeMonths,
      },
      totals: {
        income: transactionStats.income,
        expense: transactionStats.expense,
        transfer: transactionStats.transfer,
        net: round2(transactionStats.income - transactionStats.expense),
        savingsRate:
          transactionStats.income > 0
            ? round2(
                ((transactionStats.income - transactionStats.expense) /
                  transactionStats.income) *
                  100,
              )
            : null,
      },
      averages: {
        monthlyIncome: round2(transactionStats.income / activeMonths),
        monthlyExpense: round2(transactionStats.expense / activeMonths),
        expensePerTransaction:
          transactionStats.expenseCount > 0
            ? round2(transactionStats.expense / transactionStats.expenseCount)
            : 0,
      },
      currentMonth,
      monthly,
      topExpenseCategories,
      documents: { count: documents.count },
      accounts,
      categories,
      budgets,
      debts: {
        ...debts,
        totalPaid: debtPayments.totalPaid,
        paymentsCount: debtPayments.count,
      },
      transferTemplates,
      aiRegister: aiJobs,
    };
  }

  private async findUser(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  private sanitize(user: User) {
    const { password: _, ...rest } = user;
    return rest;
  }

  private async transactionStats(userId: string) {
    const row = await this.transactionRepository
      .createQueryBuilder('t')
      .select('COUNT(*)', 'count')
      .addSelect(
        `COUNT(*) FILTER (WHERE LOWER(t.type) = 'ingreso')`,
        'incomeCount',
      )
      .addSelect(
        `COUNT(*) FILTER (WHERE LOWER(t.type) = 'egreso')`,
        'expenseCount',
      )
      .addSelect(
        `COUNT(*) FILTER (WHERE LOWER(t.type) = 'transferencia')`,
        'transferCount',
      )
      .addSelect(
        `COALESCE(SUM(t.amount) FILTER (WHERE LOWER(t.type) = 'ingreso'), 0)`,
        'income',
      )
      .addSelect(
        `COALESCE(SUM(t.amount) FILTER (WHERE LOWER(t.type) = 'egreso'), 0)`,
        'expense',
      )
      .addSelect(
        `COALESCE(SUM(t.amount) FILTER (WHERE LOWER(t.type) = 'transferencia'), 0)`,
        'transfer',
      )
      .addSelect(`TO_CHAR(MIN(t.date), 'YYYY-MM-DD')`, 'firstDate')
      .addSelect(`TO_CHAR(MAX(t.date), 'YYYY-MM-DD')`, 'lastDate')
      .addSelect(`COUNT(DISTINCT DATE_TRUNC('month', t.date))`, 'activeMonths')
      .where('t.userId = :userId', { userId })
      .getRawOne<Record<string, string | null>>();

    return {
      count: toNumber(row?.count),
      incomeCount: toNumber(row?.incomeCount),
      expenseCount: toNumber(row?.expenseCount),
      transferCount: toNumber(row?.transferCount),
      income: round2(toNumber(row?.income)),
      expense: round2(toNumber(row?.expense)),
      transfer: round2(toNumber(row?.transfer)),
      firstDate: row?.firstDate ?? null,
      lastDate: row?.lastDate ?? null,
      activeMonths: toNumber(row?.activeMonths),
    };
  }

  private async currentMonthStats(userId: string) {
    const row = await this.transactionRepository
      .createQueryBuilder('t')
      .select('COUNT(*)', 'count')
      .addSelect(
        `COALESCE(SUM(t.amount) FILTER (WHERE LOWER(t.type) = 'ingreso'), 0)`,
        'income',
      )
      .addSelect(
        `COALESCE(SUM(t.amount) FILTER (WHERE LOWER(t.type) = 'egreso'), 0)`,
        'expense',
      )
      .where('t.userId = :userId', { userId })
      .andWhere(
        `DATE_TRUNC('month', t.date) = DATE_TRUNC('month', CURRENT_DATE)`,
      )
      .getRawOne<Record<string, string | null>>();

    const income = round2(toNumber(row?.income));
    const expense = round2(toNumber(row?.expense));
    return {
      month: new Date().toISOString().slice(0, 7),
      count: toNumber(row?.count),
      income,
      expense,
      net: round2(income - expense),
    };
  }

  /** Ingresos/egresos de los últimos 12 meses (incluye el actual), con meses vacíos en 0. */
  private async monthlySeries(userId: string) {
    const rows = await this.transactionRepository
      .createQueryBuilder('t')
      .select(`TO_CHAR(t.date, 'YYYY-MM')`, 'month')
      .addSelect(
        `COALESCE(SUM(t.amount) FILTER (WHERE LOWER(t.type) = 'ingreso'), 0)`,
        'income',
      )
      .addSelect(
        `COALESCE(SUM(t.amount) FILTER (WHERE LOWER(t.type) = 'egreso'), 0)`,
        'expense',
      )
      .addSelect('COUNT(*)', 'count')
      .where('t.userId = :userId', { userId })
      .andWhere(
        `t.date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '${MONTHLY_SERIES_LENGTH - 1} months'`,
      )
      .groupBy(`TO_CHAR(t.date, 'YYYY-MM')`)
      .getRawMany<{
        month: string;
        income: string;
        expense: string;
        count: string;
      }>();

    const byMonth = new Map(rows.map((r) => [r.month, r]));
    const now = new Date();
    const series: {
      month: string;
      income: number;
      expense: number;
      net: number;
      count: number;
    }[] = [];

    for (let i = MONTHLY_SERIES_LENGTH - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const row = byMonth.get(month);
      const income = round2(toNumber(row?.income));
      const expense = round2(toNumber(row?.expense));
      series.push({
        month,
        income,
        expense,
        net: round2(income - expense),
        count: toNumber(row?.count),
      });
    }
    return series;
  }

  private async topExpenseCategories(userId: string) {
    const rows = await this.transactionRepository
      .createQueryBuilder('t')
      .select('t.category', 'category')
      .addSelect('SUM(t.amount)', 'total')
      .addSelect('COUNT(*)', 'count')
      .where('t.userId = :userId', { userId })
      .andWhere(`LOWER(t.type) = 'egreso'`)
      .groupBy('t.category')
      .orderBy('total', 'DESC')
      .limit(TOP_CATEGORIES_LIMIT)
      .getRawMany<{ category: string; total: string; count: string }>();

    return rows.map((r) => ({
      category: r.category,
      total: round2(toNumber(r.total)),
      count: toNumber(r.count),
    }));
  }

  private async documentCount(userId: string) {
    const row = await this.documentRepository
      .createQueryBuilder('document')
      .innerJoin(
        Transaction,
        'transaction',
        'CAST(transaction.id AS text) = document.refId',
      )
      .select('COUNT(*)', 'count')
      .addSelect(
        'COUNT(DISTINCT document.refId)',
        'transactionsWithAttachments',
      )
      .where('document.module = :module', { module: DOCUMENT_MODULE })
      .andWhere('transaction.userId = :userId', { userId })
      .getRawOne<Record<string, string>>();

    return {
      count: toNumber(row?.count),
      transactionsWithAttachments: toNumber(row?.transactionsWithAttachments),
    };
  }

  private async accountStats(userId: string) {
    const row = await this.accountRepository
      .createQueryBuilder('a')
      .select('COUNT(*)', 'count')
      .addSelect('COUNT(*) FILTER (WHERE a.isActive)', 'active')
      .addSelect('COUNT(*) FILTER (WHERE a.isCredit)', 'credit')
      .addSelect(
        'COALESCE(SUM(a.balance) FILTER (WHERE NOT a.isCredit), 0)',
        'totalBalance',
      )
      .addSelect(
        'COALESCE(SUM(a.creditLimit) FILTER (WHERE a.isCredit), 0)',
        'totalCreditLimit',
      )
      .where('a.userId = :userId', { userId })
      .getRawOne<Record<string, string>>();

    return {
      count: toNumber(row?.count),
      active: toNumber(row?.active),
      credit: toNumber(row?.credit),
      totalBalance: round2(toNumber(row?.totalBalance)),
      totalCreditLimit: round2(toNumber(row?.totalCreditLimit)),
    };
  }

  private async categoryStats(userId: string) {
    const row = await this.categoryRepository
      .createQueryBuilder('c')
      .select('COUNT(*)', 'count')
      .addSelect(`COUNT(*) FILTER (WHERE c.type = 'ingreso')`, 'income')
      .addSelect(`COUNT(*) FILTER (WHERE c.type = 'egreso')`, 'expense')
      .where('c.userId = :userId', { userId })
      .getRawOne<Record<string, string>>();

    return {
      count: toNumber(row?.count),
      income: toNumber(row?.income),
      expense: toNumber(row?.expense),
    };
  }

  private async budgetStats(userId: string) {
    const now = new Date();
    const row = await this.budgetRepository
      .createQueryBuilder('b')
      .innerJoin('b.category', 'c')
      .select('COUNT(*)', 'count')
      .addSelect(
        'COUNT(*) FILTER (WHERE b.year = :year AND b.month = :month AND b.isActive)',
        'currentMonth',
      )
      .addSelect(
        'COALESCE(SUM(b.amount) FILTER (WHERE b.year = :year AND b.month = :month AND b.isActive), 0)',
        'currentMonthAmount',
      )
      .where('c.userId = :userId', { userId })
      .setParameters({ year: now.getFullYear(), month: now.getMonth() + 1 })
      .getRawOne<Record<string, string>>();

    return {
      count: toNumber(row?.count),
      currentMonth: toNumber(row?.currentMonth),
      currentMonthAmount: round2(toNumber(row?.currentMonthAmount)),
    };
  }

  private async debtStats(userId: string) {
    const row = await this.debtRepository
      .createQueryBuilder('d')
      .select('COUNT(*)', 'count')
      .addSelect(`COUNT(*) FILTER (WHERE d.status = 'pending')`, 'pending')
      .addSelect(`COUNT(*) FILTER (WHERE d.status = 'paid')`, 'paid')
      .addSelect(
        `COALESCE(SUM(d.remainingAmount) FILTER (WHERE d.status = 'pending'), 0)`,
        'totalRemaining',
      )
      .addSelect(
        `COUNT(*) FILTER (WHERE d.status = 'pending' AND d.dueDate < CURRENT_DATE)`,
        'overdue',
      )
      .where('d.userId = :userId', { userId })
      .getRawOne<Record<string, string>>();

    return {
      count: toNumber(row?.count),
      pending: toNumber(row?.pending),
      paid: toNumber(row?.paid),
      overdue: toNumber(row?.overdue),
      totalRemaining: round2(toNumber(row?.totalRemaining)),
    };
  }

  private async debtPaymentStats(userId: string) {
    const row = await this.debtPaymentRepository
      .createQueryBuilder('p')
      .innerJoin('p.debt', 'd')
      .select('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(p.amount), 0)', 'totalPaid')
      .where('d.userId = :userId', { userId })
      .getRawOne<Record<string, string>>();

    return {
      count: toNumber(row?.count),
      totalPaid: round2(toNumber(row?.totalPaid)),
    };
  }

  private async transferTemplateStats(userId: string) {
    const row = await this.transferTemplateRepository
      .createQueryBuilder('tt')
      .select('COUNT(*)', 'count')
      .addSelect('COUNT(*) FILTER (WHERE tt.isActive)', 'active')
      .where('tt.userId = :userId', { userId })
      .getRawOne<Record<string, string>>();

    return {
      count: toNumber(row?.count),
      active: toNumber(row?.active),
    };
  }

  private async aiJobStats(userId: string) {
    const row = await this.aiRegisterJobRepository
      .createQueryBuilder('j')
      .select('COUNT(*)', 'count')
      .addSelect(`COUNT(*) FILTER (WHERE j.status = 'completed')`, 'completed')
      .addSelect(`COUNT(*) FILTER (WHERE j.status = 'failed')`, 'failed')
      .where('j.userId = :userId', { userId })
      .getRawOne<Record<string, string>>();

    return {
      count: toNumber(row?.count),
      completed: toNumber(row?.completed),
      failed: toNumber(row?.failed),
    };
  }
}
