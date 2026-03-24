import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { TransferTemplate } from "./transfer-template.entity";

export type ReminderStatus = "scheduled" | "sent" | "dismissed";

@Entity("reminders")
export class Reminder {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "template_id", type: "uuid" })
  templateId: string;

  @Column({ name: "scheduled_at", type: "timestamp without time zone" })
  scheduledAt: Date;

  @Column({
    name: "sent_at",
    type: "timestamp without time zone",
    nullable: true,
  })
  sentAt?: Date | null;

  @Column({
    name: "status",
    type: "varchar",
    length: 20,
    default: "scheduled",
  })
  status: ReminderStatus;

  @Column({
    name: "created_at",
    type: "timestamp without time zone",
    default: () => "now()",
  })
  createdAt: Date;

  @ManyToOne(() => TransferTemplate, (template) => template.reminders, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "template_id" })
  template: TransferTemplate;
}

