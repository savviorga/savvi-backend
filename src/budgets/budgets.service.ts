import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Budget } from './entities/budget.entity';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@Injectable()
export class BudgetsService {
  constructor(
    @InjectRepository(Budget)
    private readonly budgetRepository: Repository<Budget>,
  ) {}

  async create(dto: CreateBudgetDto): Promise<Budget> {
    const existing = await this.budgetRepository.findOne({
      where: {
        categoryId: dto.categoryId,
        period: dto.period,
        year: dto.year,
        month: dto.month,
      },
    });

    if (existing) {
      existing.amount = dto.amount;
      if (dto.isActive !== undefined) {
        existing.isActive = dto.isActive;
      }
      return this.budgetRepository.save(existing);
    }

    const budget = this.budgetRepository.create({
      ...dto,
    });
    return this.budgetRepository.save(budget);
  }

  findAll(): Promise<Budget[]> {
    return this.budgetRepository.find({
      relations: ['category'],
      order: { year: 'DESC', month: 'DESC', createdAt: 'DESC' },
    });
  }

  findOne(id: string): Promise<Budget | null> {
    return this.budgetRepository.findOne({
      where: { id },
      relations: ['category'],
    });
  }

  async update(id: string, dto: UpdateBudgetDto): Promise<Budget> {
    const budget = await this.findOne(id);
    if (!budget) {
      throw new NotFoundException(`Budget with id ${id} not found`);
    }
    Object.assign(budget, dto);
    return this.budgetRepository.save(budget);
  }

  async remove(id: string): Promise<void> {
    await this.budgetRepository.delete(id);
  }
}

