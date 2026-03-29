import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WaitingList } from './entities/waiting-list.entity';
import { WaitingListService } from './waitinglist.service';
import { WaitingListController } from './waitinglist.controller';

@Module({
  imports: [TypeOrmModule.forFeature([WaitingList])],
  controllers: [WaitingListController],
  providers: [WaitingListService],
})
export class WaitingListModule {}
