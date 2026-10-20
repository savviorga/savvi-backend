import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
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
import { AuthService } from '../auth/auth.service';
import { TwoFactorService } from '../auth/two-factor.service';
import { AuthThrottle } from '../auth/auth-throttle';
import {
  ConfirmEmailChangeDto,
  RequestEmailChangeDto,
} from './dto/email-change.dto';

type SessionUser = { userId: string; authTime?: number };

@ApiTags('profile')
@ApiBearerAuth('JWT')
@ApiUnauthorizedResponse({ description: 'Token JWT ausente o inválido' })
@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly authService: AuthService,
    private readonly twoFactorService: TwoFactorService,
  ) {}

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
    description:
      'Actualiza el `name`. El email se cambia con POST /profile/email (requiere contraseña y código).',
  })
  @ApiOkResponse({ description: 'Perfil actualizado' })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  @ApiConflictResponse({ description: 'Ya existe un usuario con ese email' })
  updateProfile(@Req() req: Request, @Body() dto: UpdateProfileDto) {
    const userId = (req.user as { userId: string }).userId;
    return this.profileService.updateProfile(userId, dto);
  }

  @Patch('password')
  @AuthThrottle.strict()
  @ApiOperation({
    summary: 'Cambiar la contraseña',
    description:
      'Requiere la contraseña actual. Cierra todas las sesiones abiertas y devuelve un JWT nuevo (`access_token`) para seguir en esta.',
  })
  @ApiOkResponse({ description: 'Contraseña actualizada' })
  @ApiBadRequestResponse({
    description: 'Datos inválidos o la nueva contraseña es igual a la actual',
  })
  async changePassword(@Req() req: Request, @Body() dto: ChangePasswordDto) {
    const { userId, authTime } = req.user as SessionUser;
    const result = await this.profileService.changePassword(userId, dto);
    return {
      ...result,
      ...(await this.authService.rotateSession(userId, authTime)),
    };
  }

  @Post('email')
  @HttpCode(HttpStatus.OK)
  @AuthThrottle.email()
  @ApiOperation({
    summary: 'Pedir el cambio de email',
    description:
      'Valida la contraseña actual y envía un código al email nuevo. El email no cambia hasta confirmar en POST /profile/email/confirm.',
  })
  @ApiOkResponse({ description: 'Código enviado al email nuevo' })
  @ApiUnauthorizedResponse({ description: 'Contraseña incorrecta' })
  @ApiConflictResponse({ description: 'Ya existe un usuario con ese email' })
  requestEmailChange(@Req() req: Request, @Body() dto: RequestEmailChangeDto) {
    const { userId } = req.user as SessionUser;
    return this.twoFactorService.startEmailChange(
      userId,
      dto.newEmail,
      dto.currentPassword,
    );
  }

  @Post('email/confirm')
  @HttpCode(HttpStatus.OK)
  @AuthThrottle.strict()
  @ApiOperation({
    summary: 'Confirmar el cambio de email',
    description:
      'Valida el código enviado al email nuevo y lo aplica. Cierra las demás sesiones y devuelve el usuario y un JWT nuevo.',
  })
  @ApiOkResponse({ description: 'Email actualizado' })
  @ApiBadRequestResponse({ description: 'Código incorrecto o expirado' })
  async confirmEmailChange(
    @Req() req: Request,
    @Body() dto: ConfirmEmailChangeDto,
  ) {
    const { userId, authTime } = req.user as SessionUser;
    await this.twoFactorService.confirmEmailChange(userId, dto.code);
    return this.authService.rotateSession(userId, authTime);
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
