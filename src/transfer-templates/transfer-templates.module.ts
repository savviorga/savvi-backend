import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TransactionsModule } from "../transactions/transactions.module";
import { AccountsModule } from "../accounts/accounts.module";
import { Reminder } from "./entities/reminder.entity";
import { TransferTemplate } from "./entities/transfer-template.entity";
import { RemindersService } from "./reminders.service";
import { TransferTemplatesService } from "./transfer-templates.service";
import { TransferTemplatesController } from "./transfer-templates.controller";
import { RemindersController } from "./reminders.controller";
import { RemindersCronJob } from "./reminders.cron";

@Module({
  imports: [
    TypeOrmModule.forFeature([TransferTemplate, Reminder]),
    TransactionsModule,
    AccountsModule,
  ],
  controllers: [TransferTemplatesController, RemindersController],
  providers: [TransferTemplatesService, RemindersService, RemindersCronJob],
})
export class TransferTemplatesModule {}

