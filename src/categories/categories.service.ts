import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Not, Repository } from 'typeorm';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { Transaction } from '../transactions/entities/transaction.entity';
import { Budget } from '../budgets/entities/budget.entity';

export type CategoryWithUsage = Category & {
  /** Transacciones registradas directamente en la categoría. */
  transactionsCount: number;
  /** Presupuestos de la categoría (se borran con ella). */
  budgetsCount: number;
};

const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;

/**
 * Categorías con grupos de dos niveles: una categoría principal (grupo) puede
 * tener subcategorías. Las transacciones pueden ir en cualquiera de las dos.
 */
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
    const name = createCategoryDto.name.trim();
    const parentId = createCategoryDto.parentId ?? null;

    if (parentId) {
      await this.assertValidParent(userId, parentId, createCategoryDto.type);
    }
    await this.assertUniqueName(userId, name, createCategoryDto.type, parentId);

    const category = this.categoryRepository.create({
      ...createCategoryDto,
      name,
      parentId,
      userId,
    });
    return await this.categoryRepository.save(category);
  }

  /** Categorías del usuario con cuántas transacciones y presupuestos tiene cada una. */
  async findAll(userId: string): Promise<CategoryWithUsage[]> {
    const [categories, transactionCounts, budgetCounts] = await Promise.all([
      this.categoryRepository.find({
        where: { userId },
        order: { name: 'ASC' },
      }),
      this.categoryRepository.manager
        .createQueryBuilder(Transaction, 't')
        .select('t.categoryId', 'categoryId')
        .addSelect('COUNT(*)', 'count')
        .where('t.userId = :userId', { userId })
        .groupBy('t.categoryId')
        .getRawMany<{ categoryId: string; count: string }>(),
      this.categoryRepository.manager
        .createQueryBuilder(Budget, 'b')
        .innerJoin('b.category', 'c')
        .select('b.categoryId', 'categoryId')
        .addSelect('COUNT(*)', 'count')
        .where('c.userId = :userId', { userId })
        .groupBy('b.categoryId')
        .getRawMany<{ categoryId: string; count: string }>(),
    ]);

    const toMap = (rows: { categoryId: string; count: string }[]) =>
      new Map(rows.map((row) => [row.categoryId, Number(row.count)]));
    const transactionsBy = toMap(transactionCounts);
    const budgetsBy = toMap(budgetCounts);

    return categories.map((category) => ({
      ...category,
      transactionsCount: transactionsBy.get(category.id) ?? 0,
      budgetsCount: budgetsBy.get(category.id) ?? 0,
    }));
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

  /**
   * Edita la categoría. Cambiar el tipo de un grupo cambia también el de sus
   * subcategorías, para que el grupo nunca mezcle ingresos y gastos.
   */
  async update(
    userId: string,
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.findOne(userId, id);

    const name = updateCategoryDto.name?.trim() ?? category.name;
    const type = updateCategoryDto.type ?? category.type;
    const parentId =
      updateCategoryDto.parentId !== undefined
        ? updateCategoryDto.parentId
        : category.parentId;

    if (parentId) {
      if (parentId === id) {
        throw new BadRequestException(
          'Una categoría no puede pertenecer a sí misma',
        );
      }
      const childrenCount = await this.countChildren(userId, id);
      if (childrenCount > 0) {
        throw new BadRequestException(
          `Esta categoría es un grupo con ${plural(childrenCount, 'subcategoría', 'subcategorías')}: no puede quedar dentro de otro grupo.`,
        );
      }
      await this.assertValidParent(userId, parentId, type);
    }

    if (
      name.toLowerCase() !== category.name.toLowerCase() ||
      type !== category.type ||
      parentId !== category.parentId
    ) {
      await this.assertUniqueName(userId, name, type, parentId, id);
    }

    return this.categoryRepository.manager.transaction(async (manager) => {
      Object.assign(category, updateCategoryDto, { name, type, parentId });
      const saved = await manager.save(category);
      if (!parentId) {
        await manager.update(
          Category,
          { userId, parentId: id, type: Not(type) },
          { type },
        );
      }
      return saved;
    });
  }

  /**
   * Elimina la categoría. No se permite si tiene transacciones. Si es un grupo
   * con subcategorías, solo se elimina con `releaseChildren`: las subcategorías
   * quedan como principales y conservan sus transacciones.
   */
  async remove(
    userId: string,
    id: string,
    releaseChildren = false,
  ): Promise<void> {
    await this.findOne(userId, id);

    // Las transacciones dependen de la categoría (category_id): no se dejan huérfanas.
    const used = await this.categoryRepository.manager.count(Transaction, {
      where: { userId, categoryId: id },
    });
    if (used > 0) {
      throw new ConflictException(
        `No puedes eliminar esta categoría: tiene ${plural(used, 'transacción', 'transacciones')}. Cámbialas de categoría o desactívala.`,
      );
    }

    const childrenCount = await this.countChildren(userId, id);
    if (childrenCount > 0 && !releaseChildren) {
      throw new ConflictException(
        `Este grupo tiene ${plural(childrenCount, 'subcategoría', 'subcategorías')}. Muévelas a otro grupo o elimina el grupo dejándolas como categorías principales.`,
      );
    }

    await this.categoryRepository.manager.transaction(async (manager) => {
      if (childrenCount > 0) {
        await manager.update(
          Category,
          { userId, parentId: id },
          { parentId: null },
        );
      }
      await manager.delete(Category, { id, userId });
    });
  }

  async updateBudget(
    userId: string,
    id: string,
    updateBudgetDto: UpdateBudgetDto,
  ): Promise<Category> {
    const category = await this.findOne(userId, id);

    if (typeof updateBudgetDto.budgetLimit === 'number') {
      category.budgetLimit = updateBudgetDto.budgetLimit;
    }

    return this.categoryRepository.save(category);
  }

  private countChildren(userId: string, id: string): Promise<number> {
    return this.categoryRepository.count({ where: { userId, parentId: id } });
  }

  /** El grupo debe ser del usuario, principal (dos niveles) y del mismo tipo. */
  private async assertValidParent(
    userId: string,
    parentId: string,
    type: Category['type'],
  ): Promise<Category> {
    const parent = await this.categoryRepository.findOne({
      where: { id: parentId, userId },
    });
    if (!parent) {
      throw new BadRequestException('El grupo elegido no existe');
    }
    if (parent.parentId) {
      throw new BadRequestException(
        `"${parent.name}" ya está dentro de otro grupo: elige una categoría principal.`,
      );
    }
    if (parent.type !== type) {
      throw new BadRequestException(
        `La subcategoría debe ser del mismo tipo que el grupo "${parent.name}" (${parent.type === 'ingreso' ? 'ingresos' : 'gastos'}).`,
      );
    }
    return parent;
  }

  /** Sin nombres repetidos al mismo nivel (mismo grupo y tipo), ignorando mayúsculas. */
  private async assertUniqueName(
    userId: string,
    name: string,
    type: Category['type'],
    parentId: string | null,
    excludeId?: string,
  ): Promise<void> {
    const query = this.categoryRepository
      .createQueryBuilder('c')
      .where('c.userId = :userId', { userId })
      .andWhere('LOWER(TRIM(c.name)) = LOWER(:name)', { name })
      .andWhere('c.type = :type', { type });
    if (parentId) query.andWhere('c.parentId = :parentId', { parentId });
    else query.andWhere('c.parentId IS NULL');
    if (excludeId) query.andWhere('c.id <> :excludeId', { excludeId });

    if (await query.getExists()) {
      throw new ConflictException(
        parentId
          ? `Ya existe una subcategoría "${name}" en este grupo.`
          : `Ya tienes una categoría "${name}".`,
      );
    }
  }
}
