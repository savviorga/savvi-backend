import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { WaitingListService } from './waitinglist.service';
import { CreateWaitingListDto } from './dto/create-waiting-list.dto';

@ApiTags('waitinglist')
@Controller('waitinglist')
export class WaitingListController {
  constructor(private readonly waitingListService: WaitingListService) {}

  @Post()
  @ApiOperation({
    summary: 'Unirse a la lista de espera',
    description:
      'Registra un correo electrónico en la lista de espera. Endpoint público (no requiere autenticación).',
  })
  @ApiCreatedResponse({ description: 'Email registrado en la lista de espera' })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  @ApiConflictResponse({ description: 'El email ya está registrado' })
  create(@Body() createWaitingListDto: CreateWaitingListDto) {
    return this.waitingListService.create(createWaitingListDto);
  }
}
