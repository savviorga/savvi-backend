import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TransactionsService } from "../transactions/services/transactions.service";
import { CreateTransactionDto } from "../transactions/dto/create-transaction.dto";
import { CreateTransferTemplateDto } from "./dto/create-transfer-template.dto";
import { UpdateTransferTemplateDto } from "./dto/update-transfer-template.dto";
import { ExecuteTransferDto } from "./dto/execute-transfer.dto";
import {
  TransferTemplate,
  TransferTemplateFrequency,
} from "./entities/transfer-template.entity";
import { RemindersService } from "./reminders.service";
import { Reminder } from "./entities/reminder.entity";
import { calcNextDueDate } from "./transfer-schedule.util";
import { AccountsService } from "../accounts/accounts.service";

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return value.slice(0, maxLength);
}

@Injectable()
export class TransferTemplatesService {
  constructor(
    @InjectRepository(TransferTemplate)
    private readonly templateRepository: Repository<TransferTemplate>,
    @InjectRepository(Reminder)
    private readonly reminderRepository: Repository<Reminder>,
    private readonly transactionsService: TransactionsService,
    private readonly remindersService: RemindersService,
    private readonly accountsService: AccountsService,
  ) {}

  async create(
    userId: string,
    dto: CreateTransferTemplateDto,
  ): Promise<TransferTemplate> {
    await this.accountsService.assertOwnedByUser(userId, dto.fromAccountId);

    const customDays =
      dto.frequency === "custom" ? dto.customIntervalDays ?? null : null;
    const nextDueDate = calcNextDueDate(
      dto.frequency,
      dto.dayOfMonth,
      customDays,
    );

    const template = this.templateRepository.create({
      userId,
      fromAccountId: dto.fromAccountId,
      name: dto.name,
      payeeName: dto.payeeName,
      payeeAccount: dto.payeeAccount ?? null,
      payeeBank: dto.payeeBank ?? null,
      lastAmount: dto.initialAmount ?? null,
      recurrenceType: dto.recurrenceType,
      frequency: dto.frequency,
      dayOfMonth: dto.dayOfMonth,
      customIntervalDays: customDays,
      nextDueDate,
      isActive: true,
    });

    template.updatedAt = new Date();
    template.createdAt = new Date();

    return await this.templateRepository.save(template);
  }

  async findAll(userId: string): Promise<TransferTemplate[]> {
    return this.templateRepository.find({
      where: { userId },
      relations: ["fromAccount"],
      order: { nextDueDate: "ASC", updatedAt: "DESC" },
    });
  }

  async findDueToday(): Promise<TransferTemplate[]> {
    return this.templateRepository
      .createQueryBuilder("t")
      .where("t.nextDueDate = CURRENT_DATE")
      .andWhere("t.isActive = true")
      .getMany();
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateTransferTemplateDto,
  ): Promise<TransferTemplate> {
    const template = await this.templateRepository.findOne({
      where: { id, userId },
    });
    if (!template) throw new NotFoundException("Plantilla no encontrada");

    if (dto.fromAccountId !== undefined) {
      await this.accountsService.assertOwnedByUser(userId, dto.fromAccountId);
      template.fromAccountId = dto.fromAccountId;
    }
    if (dto.name !== undefined) template.name = dto.name;
    if (dto.payeeName !== undefined) template.payeeName = dto.payeeName;
    if (dto.payeeAccount !== undefined) {
      template.payeeAccount = dto.payeeAccount?.trim() || null;
    }
    if (dto.payeeBank !== undefined) {
      template.payeeBank = dto.payeeBank?.trim() || null;
    }
    if (dto.recurrenceType !== undefined) {
      template.recurrenceType = dto.recurrenceType;
    }

    const prevSchedule = {
      frequency: template.frequency,
      dayOfMonth: template.dayOfMonth,
      customIntervalDays: template.customIntervalDays,
    };

    if (dto.frequency !== undefined) {
      template.frequency = dto.frequency as TransferTemplateFrequency;
      if (dto.frequency !== "custom") {
        template.customIntervalDays = null;
      }
    }
    if (dto.customIntervalDays !== undefined) {
      template.customIntervalDays = dto.customIntervalDays;
    }
    if (dto.dayOfMonth !== undefined) {
      template.dayOfMonth = dto.dayOfMonth;
    }

    const scheduleChanged =
      template.frequency !== prevSchedule.frequency ||
      template.dayOfMonth !== prevSchedule.dayOfMonth ||
      template.customIntervalDays !== prevSchedule.customIntervalDays;

    if (scheduleChanged) {
      const freq = template.frequency;
      if (freq === "custom") {
        const days = template.customIntervalDays;
        if (days == null || days < 1) {
          throw new BadRequestException(
            "Para frecuencia personalizada indica el intervalo en días (1-3660).",
          );
        }
      }
      template.nextDueDate = calcNextDueDate(
        freq,
        template.dayOfMonth,
        template.customIntervalDays ?? null,
      );
    }

    template.updatedAt = new Date();
    return this.templateRepository.save(template);
  }

  async toggleActive(
    userId: string,
    id: string,
  ): Promise<TransferTemplate> {
    const template = await this.templateRepository.findOne({
      where: { id, userId },
    });
    if (!template) throw new NotFoundException("Plantilla no encontrada");

    template.isActive = !template.isActive;
    template.updatedAt = new Date();
    return this.templateRepository.save(template);
  }

  async executeTransfer(
    userId: string,
    dto: ExecuteTransferDto,
  ): Promise<{ transaction: unknown; template: TransferTemplate }> {
    const template = await this.templateRepository.findOne({
      where: { id: dto.templateId, userId },
    });
    if (!template) throw new NotFoundException("Plantilla no encontrada");
    if (!template.isActive) {
      throw new BadRequestException("La plantilla está inactiva");
    }

    const amount = Number(dto.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException("Monto inválido");
    }

    const tag = `transfer_template_id:${template.id}`;
    const baseDescription =
      dto.description?.trim() ||
      `Pago recurrente: ${template.name} (${template.payeeName})`;
    const description = truncate(`${baseDescription} (${tag})`, 500);

    const transactionPayload: CreateTransactionDto = {
      date: new Date().toISOString().slice(0, 10),
      type: dto.transactionType ?? "egreso",
      amount,
      category: truncate(template.name || "Transferencia", 100),
      account: template.fromAccountId,
      description,
    };

    const transaction = await this.transactionsService.create(
      template.userId,
      transactionPayload,
    );

    // Guardar historial y preparar próxima ocurrencia
    template.lastAmount = amount;
    template.nextDueDate = calcNextDueDate(
      template.frequency as unknown as TransferTemplateFrequency,
      template.dayOfMonth,
      template.customIntervalDays ?? null,
    );
    template.updatedAt = new Date();
    await this.templateRepository.save(template);

    // Si existe un recordatorio “scheduled” para esta ocurrencia, lo marcamos como enviado.
    await this.markLatestScheduledReminderAsSent(template.id);

    return { transaction, template };
  }

  private async markLatestScheduledReminderAsSent(
    templateId: string,
  ): Promise<void> {
    const reminder = await this.reminderRepository.findOne({
      where: { templateId, status: "scheduled" },
      order: { scheduledAt: "DESC" },
    });

    if (!reminder) return;
    await this.remindersService.markAsSent(reminder.id);
  }
}

