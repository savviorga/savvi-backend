import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { Document } from '../transactions/entities/document.entity';
import { Account } from '../accounts/entities/account.entity';
import { Category } from '../categories/entities/category.entity';
import { Budget } from '../budgets/entities/budget.entity';
import { Debt } from '../payment-planner/entities/debt.entity';
import { DebtPayment } from '../payment-planner/entities/debt-payment.entity';
import { TransferTemplate } from '../transfer-templates/entities/transfer-template.entity';
import { AiRegisterJob } from '../ai-register/entities/ai-register-job.entity';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Transaction,
      Document,
      Account,
      Category,
      Budget,
      Debt,
      DebtPayment,
      TransferTemplate,
      AiRegisterJob,
    ]),
  ],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
