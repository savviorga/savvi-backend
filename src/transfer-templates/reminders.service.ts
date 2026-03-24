import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Reminder } from "./entities/reminder.entity";
import { TransferTemplate } from "./entities/transfer-template.entity";
import { calcNextDueDate } from "./transfer-schedule.util";

@Injectable()
export class RemindersService {
  constructor(
    @InjectRepository(Reminder)
    private readonly reminderRepository: Repository<Reminder>,
    @InjectRepository(TransferTemplate)
    private readonly templateRepository: Repository<TransferTemplate>,
  ) {}

  async findPendingForUser(userId: string): Promise<Reminder[]> {
    return this.reminderRepository
      .createQueryBuilder("r")
      .innerJoinAndSelect("r.template", "t")
      .where("t.userId = :userId", { userId })
      .andWhere("t.nextDueDate = CURRENT_DATE")
      .andWhere("t.isActive = true")
      .andWhere("r.status = :status", { status: "scheduled" })
      .orderBy("r.scheduledAt", "ASC")
      .getMany();
  }

  async generateForTemplate(templateId: string): Promise<void> {
    const template = await this.templateRepository.findOne({
      where: { id: templateId },
    });
    if (!template) throw new NotFoundException("Plantilla no encontrada");
    if (!template.isActive) return;

    const scheduledAt = new Date(template.nextDueDate);
    scheduledAt.setDate(scheduledAt.getDate() - 1);

    // Evita duplicados si el job corre varias veces sin que el usuario actúe.
    const scheduledDate = `${scheduledAt.getFullYear()}-${String(
      scheduledAt.getMonth() + 1,
    ).padStart(2, "0")}-${String(scheduledAt.getDate()).padStart(
      2,
      "0",
    )}`;

    const existing = await this.reminderRepository
      .createQueryBuilder("r")
      .where("r.templateId = :templateId", { templateId })
      .andWhere("r.status = :status", { status: "scheduled" })
      .andWhere("DATE(r.scheduledAt) = :scheduledDate", { scheduledDate })
      .getOne();

    if (existing) return;

    const reminder = this.reminderRepository.create({
      templateId: template.id,
      scheduledAt,
      status: "scheduled",
    });

    await this.reminderRepository.save(reminder);
  }

  async markAsSent(id: string): Promise<void> {
    const reminder = await this.reminderRepository.findOne({ where: { id } });
    if (!reminder) throw new NotFoundException("Recordatorio no encontrado");

    reminder.sentAt = new Date();
    reminder.status = "sent";
    await this.reminderRepository.save(reminder);
  }

  async dismiss(id: string, userId: string): Promise<void> {
    const reminder = await this.reminderRepository.findOne({
      where: { id },
      relations: ["template"],
    });
    if (!reminder) throw new NotFoundException("Recordatorio no encontrado");

    if (!reminder.template || reminder.template.userId !== userId) {
      throw new BadRequestException("No autorizado");
    }

    reminder.sentAt = null;
    reminder.status = "dismissed";
    await this.reminderRepository.save(reminder);

    // Para que “Posponer” realmente mueva el pago a la siguiente ocurrencia,
    // avanzamos la próxima fecha de vencimiento en la plantilla.
    const nextDueDate = calcNextDueDate(
      reminder.template.frequency,
      reminder.template.dayOfMonth,
      reminder.template.customIntervalDays ?? null,
    );

    reminder.template.nextDueDate = nextDueDate;
    reminder.template.updatedAt = new Date();
    await this.templateRepository.save(reminder.template);
  }
}

