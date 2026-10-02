import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('profile')
@ApiBearerAuth('JWT')
@ApiUnauthorizedResponse({ description: 'Token JWT ausente o inválido' })
@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ApiOperation({
    summary: 'Obtener el perfil del usuario autenticado',
    description: 'Devuelve los datos del usuario (sin contraseña).',
  })
  @ApiOkResponse({ description: 'Perfil del usuario' })
  getProfile(@Req() req: Request) {
    const userId = (req.user as { userId: string }).userId;
    return this.profileService.getProfile(userId);
  }

  @Patch()
  @ApiOperation({
    summary: 'Editar el perfil',
    description: 'Actualiza parcialmente `name` y/o `email` del usuario.',
  })
  @ApiOkResponse({ description: 'Perfil actualizado' })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  @ApiConflictResponse({ description: 'Ya existe un usuario con ese email' })
  updateProfile(@Req() req: Request, @Body() dto: UpdateProfileDto) {
    const userId = (req.user as { userId: string }).userId;
    return this.profileService.updateProfile(userId, dto);
  }

  @Patch('password')
  @ApiOperation({
    summary: 'Cambiar la contraseña',
    description:
      'Requiere la contraseña actual. El token vigente sigue siendo válido.',
  })
  @ApiOkResponse({ description: 'Contraseña actualizada' })
  @ApiBadRequestResponse({
    description: 'Datos inválidos o la nueva contraseña es igual a la actual',
  })
  changePassword(@Req() req: Request, @Body() dto: ChangePasswordDto) {
    const userId = (req.user as { userId: string }).userId;
    return this.profileService.changePassword(userId, dto);
  }

  @Get('summary')
  @ApiOperation({
    summary: 'Resumen y métricas del usuario',
    description:
      'Totales históricos de ingresos/egresos, conteos de transacciones, mes actual, serie de los últimos 12 meses, top categorías de gasto y resumen de cuentas, categorías, presupuestos, deudas, plantillas y AI Register.',
  })
  @ApiOkResponse({ description: 'Resumen general del usuario' })
  getSummary(@Req() req: Request) {
    const userId = (req.user as { userId: string }).userId;
    return this.profileService.getSummary(userId);
  }
}
