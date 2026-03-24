import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Budget } from "./budget.entity";

/**
 * Partidas del presupuesto (ej. facturas de gas, luz, teléfono, arriendo).
 */
@Entity("budget_details")
export class BudgetDetail {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  budgetId: string;

  @ManyToOne(() => Budget, (b) => b.details, { onDelete: "CASCADE" })
  @JoinColumn({ name: "budgetId" })
  budget: Budget;

  /** Nombre corto: "Gas", "Luz", "Arriendo", "Teléfono" */
  @Column({ type: "varchar", length: 200 })
  label: string;

  /** Notas o referencia (nº factura, proveedor, etc.) */
  @Column({ type: "text", nullable: true })
  description?: string | null;

  /** Monto estimado de esta partida (opcional; informativo) */
  @Column({ type: "numeric", precision: 12, scale: 2, nullable: true })
  estimatedAmount?: number | null;

  @Column({ type: "smallint", default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
