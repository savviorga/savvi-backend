import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Debt } from './entities/debt.entity';
import { DebtPayment } from './entities/debt-payment.entity';
import { PaymentPlannerService } from './payment-planner.service';
import { PaymentPlannerController } from './payment-planner.controller';
import { TransactionsModule } from '../transactions/transactions.module';
import { AccountsModule } from '../accounts/accounts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Debt, DebtPayment]),
    TransactionsModule,
    AccountsModule,
  ],
  controllers: [PaymentPlannerController],
  providers: [PaymentPlannerService],
})
export class PaymentPlannerModule {}
