import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DebtPayment } from './debt-payment.entity';
import { User } from '../../auth/entities/user.entity';

export type DebtStatus = 'pending' | 'paid';

@Entity('debts')
export class Debt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 200 })
  payee: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  remainingAmount: number;

  @Column({ type: 'date' })
  dueDate: Date;

  // Cuenta asociada a esta obligación (para preseleccionar dónde se pagan los montos).
  // Nullable por compatibilidad con deudas ya existentes.
  @Column({ type: 'uuid', nullable: true })
  accountId?: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'boolean', default: false })
  isRecurring: boolean;

  @Column({ type: 'varchar', length: 20, nullable: true })
  recurrenceType: 'monthly' | 'biweekly' | null;

  @Column({ type: 'smallint', nullable: true })
  recurrenceDay: number | null;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: DebtStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => DebtPayment, (payment) => payment.debt)
  payments: DebtPayment[];
}
