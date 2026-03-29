import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from './config/typeorm.config';
import { TransactionsModule } from './transactions/transactions.module';
import { CategoriesModule } from './categories/categories.module';
import { AccountsModule } from './accounts/accounts.module';
import { AuthModule } from './auth/auth.module';
import { PaymentPlannerModule } from './payment-planner/payment-planner.module';
import { BudgetsModule } from './budgets/budgets.module';
import { ScheduleModule } from '@nestjs/schedule';
import { TransferTemplatesModule } from './transfer-templates/transfer-templates.module';
import { WaitingListModule } from './waitinglist/waitinglist.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(dataSourceOptions),
    ScheduleModule.forRoot(),
    AuthModule,
    TransactionsModule,
    CategoriesModule,
    AccountsModule,
    PaymentPlannerModule,
    BudgetsModule,
    TransferTemplatesModule,
    WaitingListModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
