import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "../../auth/entities/user.entity";

@Entity("accounts")
export class Account {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "user_id", type: "uuid" })
  userId: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ type: "varchar", length: 100 })
  name: string;

  @Column({ type: "varchar", nullable: true })
  icon?: string;

  @Column({ type: "varchar", nullable: true })
  color?: string; // hex or tailwind color

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
  balance: number;

  // Si esta cuenta se comporta como una cuenta de crédito (ej. tarjeta de crédito).
  @Column({ type: "boolean", default: false })
  isCredit: boolean;

  // ---- Datos para tarjeta de crédito (para calcular intereses luego) ----
  // Nota: se guardan como opcionales porque algunas tarjetas pueden no tener
  // toda la configuración disponible aún.
  @Column({ type: "decimal", precision: 12, scale: 2, nullable: true })
  creditLimit?: number;

  // Tasa anual (APR) en porcentaje (ej. 35.5 para 35.5%).
  @Column({ type: "decimal", precision: 8, scale: 4, nullable: true })
  aprRate?: number;

  // Periodo de gracia en días (simplificado).
  @Column({ type: "integer", nullable: true })
  gracePeriodDays?: number;

  // Opcional: día del mes del corte del estado.
  @Column({ type: "smallint", nullable: true })
  statementDay?: number;

  // Opcional: día del mes del vencimiento/pago.
  @Column({ type: "smallint", nullable: true })
  dueDay?: number;

  // Pago mínimo en porcentaje (opcional).
  @Column({ type: "decimal", precision: 6, scale: 2, nullable: true })
  minPaymentPercent?: number;

  // Pago mínimo en monto (opcional).
  @Column({ type: "decimal", precision: 12, scale: 2, nullable: true })
  minPaymentAmount?: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
