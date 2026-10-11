import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Category } from '../../categories/entities/category.entity';

export type TransactionFile = {
  filename: string;
  url: string;
  size: number;
  mimeType: string;
};

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'varchar', length: 50 })
  type: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ name: 'category_id', type: 'uuid' })
  categoryId: string;

  @ManyToOne(() => Category, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  /**
   * @deprecated Columna vieja `category` (texto). Solo se conserva hasta
   * eliminarla: nadie la lee y se llena con el nombre de la categoría.
   */
  @Column({
    name: 'category',
    type: 'varchar',
    length: 100,
    nullable: true,
    select: false,
  })
  legacyCategoryName: string | null;

  @Column({ type: 'varchar', length: 100 })
  account: string;

  @Column({ type: 'text', nullable: true })
  description: string;
}
