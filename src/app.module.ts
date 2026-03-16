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

@Module({
  imports: [
    TypeOrmModule.forRoot(dataSourceOptions),
    AuthModule,
    TransactionsModule,
    CategoriesModule,
    AccountsModule,
    PaymentPlannerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
