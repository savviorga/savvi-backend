import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Category } from "./entities/category.entity";
import { Repository } from "typeorm";
import { UpdateBudgetDto } from "./dto/update-budget.dto";

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(
    userId: string,
    createCategoryDto: CreateCategoryDto,
  ): Promise<Category> {
    const category = this.categoryRepository.create({
      ...createCategoryDto,
      userId,
    });
    return await this.categoryRepository.save(category);
  }

  findAll(userId: string): Promise<Category[]> {
    return this.categoryRepository.find({
      where: { userId },
      order: { name: "ASC" },
    });
  }

  async findOne(userId: string, id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id, userId },
    });
    if (!category) {
      throw new NotFoundException(`Categoría no encontrada`);
    }
    return category;
  }

  async update(
    userId: string,
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.findOne(userId, id);
    Object.assign(category, updateCategoryDto);
    return this.categoryRepository.save(category);
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.findOne(userId, id);
    await this.categoryRepository.delete({ id, userId });
  }

  async updateBudget(
    userId: string,
    id: string,
    updateBudgetDto: UpdateBudgetDto,
  ): Promise<Category> {
    const category = await this.findOne(userId, id);

    if (typeof updateBudgetDto.budgetLimit === "number") {
      category.budgetLimit = updateBudgetDto.budgetLimit;
    }

    return this.categoryRepository.save(category);
  }
}
