import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiRegisterController } from './ai-register.controller';
import { AiRegisterService } from './ai-register.service';
import { AiRegisterJob } from './entities/ai-register-job.entity';
import { TransactionsModule } from '../transactions/transactions.module';
import { S3Module } from '../s3/s3.module';

@Module({
  imports: [TypeOrmModule.forFeature([AiRegisterJob]), TransactionsModule, S3Module],
  controllers: [AiRegisterController],
  providers: [AiRegisterService],
  exports: [AiRegisterService],
})
export class AiRegisterModule {}
