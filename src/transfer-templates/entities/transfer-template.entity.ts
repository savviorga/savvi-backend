import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "../../auth/entities/user.entity";
import { Account } from "../../accounts/entities/account.entity";
import { Reminder } from "./reminder.entity";

export type TransferTemplateRecurrenceType = "reminder" | "automatic";

export type TransferTemplateFrequency =
  | "weekly"
  | "biweekly"
  | "monthly"
  | "bimonthly"
  | "custom";

@Entity("transfer_templates")
export class TransferTemplate {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "user_id", type: "uuid" })
  userId: string;

  @Column({ name: "from_account_id", type: "uuid" })
  fromAccountId: string;

  @Column({ name: "name", type: "varchar", length: 200 })
  name: string;

  @Column({ name: "payee_name", type: "varchar", length: 200 })
  payeeName: string;

  @Column({ name: "payee_account", type: "varchar", length: 100, nullable: true })
  payeeAccount?: string | null;

  @Column({ name: "payee_bank", type: "varchar", length: 100, nullable: true })
  payeeBank?: string | null;

  @Column({
    name: "last_amount",
    type: "decimal",
    precision: 12,
    scale: 2,
    nullable: true,
  })
  lastAmount?: number | null;

  @Column({
    name: "recurrence_type",
    type: "varchar",
    length: 20,
    default: "reminder",
  })
  recurrenceType: TransferTemplateRecurrenceType;

  @Column({
    name: "frequency",
    type: "varchar",
    length: 20,
    default: "monthly",
  })
  frequency: TransferTemplateFrequency;

  @Column({ name: "day_of_month", type: "smallint", nullable: false })
  dayOfMonth: number;

  /** Solo aplica si frequency === "custom": intervalo entre vencimientos en días. */
  @Column({
    name: "custom_interval_days",
    type: "int",
    nullable: true,
  })
  customIntervalDays?: number | null;

  @Column({ name: "next_due_date", type: "date" })
  nextDueDate: Date;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive: boolean;

  @Column({
    name: "created_at",
    type: "timestamp without time zone",
    default: () => "now()",
  })
  createdAt: Date;

  @Column({
    name: "updated_at",
    type: "timestamp without time zone",
    default: () => "now()",
  })
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => Account, { nullable: false })
  @JoinColumn({ name: "from_account_id" })
  fromAccount: Account;

  @OneToMany(() => Reminder, (reminder) => reminder.template)
  reminders: Reminder[];
}

