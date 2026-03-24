import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { BudgetDetail } from './budget-detail.entity';

export type BudgetPeriod = 'monthly';

@Entity('budgets')
export class Budget {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Category, { nullable: false })
  category: Category;

  @Column({ type: 'uuid' })
  categoryId: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount: number;

  /** Si es true, el monto se recalcula como la suma de estimatedAmount de las partidas. */
  @Column({ type: 'boolean', default: false })
  amountAutoCalculated: boolean;

  @Column({ type: 'varchar', length: 20, default: 'monthly' })
  period: BudgetPeriod;

  @Column({ type: 'int' })
  year: number;

  @Column({ type: 'int' })
  month: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => BudgetDetail, (d) => d.budget)
  details: BudgetDetail[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

