import { Cron } from "@nestjs/schedule";
import { Injectable } from "@nestjs/common";
import { TransferTemplatesService } from "./transfer-templates.service";
import { RemindersService } from "./reminders.service";

@Injectable()
export class RemindersCronJob {
  constructor(
    private readonly transferTemplatesService: TransferTemplatesService,
    private readonly remindersService: RemindersService,
  ) {}

  @Cron("0 8 * * *")
  async sendDailyReminders() {
    const dueTemplates = await this.transferTemplatesService.findDueToday();

    for (const template of dueTemplates) {
      if (template.recurrenceType === "reminder") {
        await this.remindersService.generateForTemplate(template.id);
      } else if (template.recurrenceType === "automatic") {
        if (template.lastAmount == null) continue;
        await this.transferTemplatesService.executeTransfer(template.userId, {
          templateId: template.id,
          amount: Number(template.lastAmount),
        });
      }
    }
  }
}

