import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiUsage } from './entities/ai-usage.entity';
import { AiUsageService } from './ai-usage.service';
import { AiUsageController } from './ai-usage.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AiUsage])],
  controllers: [AiUsageController],
  providers: [AiUsageService],
  exports: [AiUsageService],
})
export class AiUsageModule {}
