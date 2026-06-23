import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiRegisterService } from './ai-register.service';
import { CreateAiRegisterJobDto } from './dto/create-ai-register-job.dto';
import { AiRegisterJobResponseDto } from './dto/ai-register-job-response.dto';

@ApiTags('ai-register')
@ApiBearerAuth('JWT')
@ApiUnauthorizedResponse({ description: 'Token JWT ausente o inválido' })
@UseGuards(JwtAuthGuard)
@Controller('ai-register/jobs')
export class AiRegisterController {
  constructor(private readonly aiRegisterService: AiRegisterService) {}

  @Post()
  @ApiCreatedResponse({ type: AiRegisterJobResponseDto })
  @ApiBadRequestResponse({ description: 'Datos inválidos para crear el job' })
  create(@Req() req: Request, @Body() dto: CreateAiRegisterJobDto) {
    const userId = (req.user as { userId: string }).userId;
    return this.aiRegisterService.createJob(userId, dto);
  }

  @Get(':id')
  @ApiOkResponse({ type: AiRegisterJobResponseDto })
  getById(@Req() req: Request, @Param('id', ParseUUIDPipe) id: string) {
    const userId = (req.user as { userId: string }).userId;
    return this.aiRegisterService.getJob(userId, id);
  }
}
