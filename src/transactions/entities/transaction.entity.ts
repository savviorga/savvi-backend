import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Category } from '../../categories/entities/category.entity';

export const TRANSACTION_TYPES = [
  'ingreso',
  'egreso',
  'transferencia',
] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

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
  type: TransactionType;

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

  /** Id de la cuenta del usuario (`account_id`, FK a `accounts`). */
  @Column({ name: 'account_id', type: 'uuid', nullable: true })
  account: string | null;

  /**
   * Cuenta destino de una transferencia entre cuentas propias (`to_account_id`).
   * `null` en ingresos, egresos y transferencias a terceros.
   */
  @Column({ name: 'to_account_id', type: 'uuid', nullable: true })
  toAccount: string | null;

  /**
   * Texto que tenía la cuenta antes de ser un id (solo filas viejas que no se
   * pudieron enlazar a una cuenta). Para mostrarlo; no se escribe.
   */
  @Column({
    name: 'legacy_account',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  legacyAccount: string | null;

  @Column({ type: 'text', nullable: true })
  description: string;
}
