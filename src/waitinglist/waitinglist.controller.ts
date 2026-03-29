import { Body, Controller, Post } from '@nestjs/common';
import { WaitingListService } from './waitinglist.service';
import { CreateWaitingListDto } from './dto/create-waiting-list.dto';

@Controller('waitinglist')
export class WaitingListController {
  constructor(private readonly waitingListService: WaitingListService) {}

  @Post()
  create(@Body() createWaitingListDto: CreateWaitingListDto) {
    return this.waitingListService.create(createWaitingListDto);
  }
}
