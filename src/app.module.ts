import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from './config/typeorm.config';
import { TransactionsModule } from './transactions/transactions.module';
import { CategoriesModule } from './categories/categories.module';
import { AccountsModule } from './accounts/accounts.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(dataSourceOptions),
    TransactionsModule,
    CategoriesModule,
    AccountsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
