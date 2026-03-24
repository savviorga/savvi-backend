import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Budget } from "./entities/budget.entity";
import { BudgetDetail } from "./entities/budget-detail.entity";
import { CreateBudgetDto } from "./dto/create-budget.dto";
import { UpdateBudgetDto } from "./dto/update-budget.dto";
import { CreateBudgetDetailDto } from "./dto/create-budget-detail.dto";
import { UpdateBudgetDetailDto } from "./dto/update-budget-detail.dto";
import { CategoriesService } from "../categories/categories.service";

@Injectable()
export class BudgetsService {
  constructor(
    @InjectRepository(Budget)
    private readonly budgetRepository: Repository<Budget>,
    @InjectRepository(BudgetDetail)
    private readonly budgetDetailRepository: Repository<BudgetDetail>,
    private readonly categoriesService: CategoriesService,
  ) {}

  async create(userId: string, dto: CreateBudgetDto): Promise<Budget> {
    await this.categoriesService.findOne(userId, dto.categoryId);

    const auto = dto.amountAutoCalculated === true;
    if (!auto && (!dto.amount || dto.amount <= 0)) {
      throw new BadRequestException(
        "Indica un monto mayor a 0 o activá el cálculo automático desde partidas.",
      );
    }

    const existing = await this.budgetRepository.findOne({
      where: {
        categoryId: dto.categoryId,
        period: dto.period,
        year: dto.year,
        month: dto.month,
      },
    });

    if (existing) {
      existing.amountAutoCalculated = auto;
      if (dto.isActive !== undefined) {
        existing.isActive = dto.isActive;
      }
      if (auto) {
        await this.budgetRepository.save(existing);
        await this.syncAmountFromDetailsIfNeeded(existing.id);
        return this.findOne(userId, existing.id);
      }
      existing.amount = dto.amount;
      return this.budgetRepository.save(existing);
    }

    const budget = this.budgetRepository.create({
      categoryId: dto.categoryId,
      amount: auto ? 0 : dto.amount,
      amountAutoCalculated: auto,
      period: dto.period,
      year: dto.year,
      month: dto.month,
      isActive: dto.isActive ?? true,
    });
    const saved = await this.budgetRepository.save(budget);
    if (auto) {
      await this.syncAmountFromDetailsIfNeeded(saved.id);
      return this.findOne(userId, saved.id);
    }
    return saved;
  }

  private async syncAmountFromDetailsIfNeeded(budgetId: string): Promise<void> {
    const budget = await this.budgetRepository.findOne({
      where: { id: budgetId },
      relations: ["details"],
    });
    if (!budget?.amountAutoCalculated) return;
    const sum = (budget.details ?? []).reduce((s, d) => {
      const v = d.estimatedAmount;
      if (v == null || !Number.isFinite(Number(v))) return s;
      return s + Number(v);
    }, 0);
    await this.budgetRepository.update(budgetId, { amount: sum });
  }

  findAll(userId: string): Promise<Budget[]> {
    return this.budgetRepository
      .createQueryBuilder("b")
      .leftJoinAndSelect("b.category", "c")
      .leftJoinAndSelect("b.details", "d")
      .where("c.userId = :userId", { userId })
      .orderBy("b.year", "DESC")
      .addOrderBy("b.month", "DESC")
      .addOrderBy("b.createdAt", "DESC")
      .addOrderBy("d.sortOrder", "ASC")
      .getMany();
  }

  async findOne(userId: string, id: string): Promise<Budget> {
    const budget = await this.budgetRepository.findOne({
      where: { id },
      relations: ["category", "details"],
    });
    if (!budget || budget.category?.userId !== userId) {
      throw new NotFoundException(`Presupuesto no encontrado`);
    }
    if (budget.details?.length) {
      budget.details.sort((a, b) => a.sortOrder - b.sortOrder);
    }
    return budget;
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateBudgetDto,
  ): Promise<Budget> {
    const budget = await this.findOne(userId, id);
    Object.assign(budget, dto);
    return this.budgetRepository.save(budget);
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.findOne(userId, id);
    await this.budgetRepository.delete(id);
  }

  async addDetail(
    userId: string,
    budgetId: string,
    dto: CreateBudgetDetailDto,
  ): Promise<BudgetDetail> {
    await this.findOne(userId, budgetId);

    let sortOrder = dto.sortOrder ?? 0;
    if (dto.sortOrder === undefined) {
      const row = await this.budgetDetailRepository
        .createQueryBuilder("d")
        .select("COALESCE(MAX(d.sortOrder), -1)", "max")
        .where("d.budgetId = :budgetId", { budgetId })
        .getRawOne<{ max: string }>();
      sortOrder = Number(row?.max ?? -1) + 1;
    }

    const detail = this.budgetDetailRepository.create({
      budgetId,
      label: dto.label,
      description: dto.description ?? null,
      estimatedAmount:
        dto.estimatedAmount != null ? Number(dto.estimatedAmount) : null,
      sortOrder,
    });
    const saved = await this.budgetDetailRepository.save(detail);
    await this.syncAmountFromDetailsIfNeeded(budgetId);
    return saved;
  }

  async updateDetail(
    userId: string,
    budgetId: string,
    detailId: string,
    dto: UpdateBudgetDetailDto,
  ): Promise<BudgetDetail> {
    await this.findOne(userId, budgetId);
    const detail = await this.budgetDetailRepository.findOne({
      where: { id: detailId, budgetId },
    });
    if (!detail) {
      throw new NotFoundException("Partida no encontrada");
    }
    if (dto.label !== undefined) detail.label = dto.label;
    if (dto.description !== undefined) detail.description = dto.description;
    if (dto.estimatedAmount !== undefined) {
      detail.estimatedAmount =
        dto.estimatedAmount != null ? Number(dto.estimatedAmount) : null;
    }
    if (dto.sortOrder !== undefined) detail.sortOrder = dto.sortOrder;
    const saved = await this.budgetDetailRepository.save(detail);
    await this.syncAmountFromDetailsIfNeeded(budgetId);
    return saved;
  }

  async removeDetail(
    userId: string,
    budgetId: string,
    detailId: string,
  ): Promise<void> {
    await this.findOne(userId, budgetId);
    const res = await this.budgetDetailRepository.delete({
      id: detailId,
      budgetId,
    });
    if (!res.affected) {
      throw new NotFoundException("Partida no encontrada");
    }
    await this.syncAmountFromDetailsIfNeeded(budgetId);
  }
}
