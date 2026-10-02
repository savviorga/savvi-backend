import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { TwoFactorService } from './two-factor.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthResponseDto } from './dto/auth-response.dto';
import {
  ConfirmTwoFactorDto,
  DisableTwoFactorDto,
  ResendTwoFactorDto,
  VerifyTwoFactorDto,
} from './dto/two-factor.dto';
import {
  CodeSentResponseDto,
  TwoFactorStatusResponseDto,
} from './dto/two-factor-response.dto';

@ApiTags('auth')
@Controller('auth/2fa')
export class TwoFactorController {
  constructor(
    private readonly authService: AuthService,
    private readonly twoFactorService: TwoFactorService,
  ) {}

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Completar el login con el código 2FA',
    description:
      'Valida el código enviado por email tras POST /auth/login (máx. 5 intentos) y devuelve el JWT.',
  })
  @ApiOkResponse({ description: 'Login completado', type: AuthResponseDto })
  @ApiBadRequestResponse({
    description:
      'Código incorrecto, expirado, demasiados intentos o login expirado',
  })
  verify(@Body() dto: VerifyTwoFactorDto) {
    return this.authService.verifyTwoFactorLogin(dto);
  }

  @Post('resend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reenviar el código 2FA del login',
    description:
      'Envía un código nuevo (el anterior deja de servir). Máx. 5 envíos por login, uno cada 60 s.',
  })
  @ApiOkResponse({ description: 'Código reenviado', type: CodeSentResponseDto })
  @ApiBadRequestResponse({
    description: 'Login expirado o límite de reenvíos alcanzado',
  })
  @ApiTooManyRequestsResponse({
    description: 'Menos de 60 s desde el último envío',
  })
  @ApiInternalServerErrorResponse({ description: 'No se pudo enviar el email' })
  resend(@Body() dto: ResendTwoFactorDto) {
    return this.twoFactorService.resendLogin(dto);
  }

  @Post('enable')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Iniciar la activación del 2FA',
    description:
      'Envía un código al email del usuario. Se confirma con POST /auth/2fa/enable/confirm. Llamarlo otra vez reenvía el código (cada 60 s).',
  })
  @ApiOkResponse({ description: 'Código enviado', type: CodeSentResponseDto })
  @ApiBadRequestResponse({ description: 'El 2FA ya está activo' })
  @ApiUnauthorizedResponse({ description: 'Token JWT ausente o inválido' })
  @ApiTooManyRequestsResponse({
    description: 'Menos de 60 s desde el último envío',
  })
  @ApiInternalServerErrorResponse({ description: 'No se pudo enviar el email' })
  enable(@Req() req: Request) {
    const userId = (req.user as { userId: string }).userId;
    return this.twoFactorService.startEnable(userId);
  }

  @Post('enable/confirm')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Confirmar la activación del 2FA',
    description: 'Valida el código recibido y activa el 2FA.',
  })
  @ApiOkResponse({
    description: '2FA activado',
    type: TwoFactorStatusResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Código incorrecto, expirado o demasiados intentos',
  })
  @ApiUnauthorizedResponse({ description: 'Token JWT ausente o inválido' })
  confirmEnable(@Req() req: Request, @Body() dto: ConfirmTwoFactorDto) {
    const userId = (req.user as { userId: string }).userId;
    return this.twoFactorService.confirmEnable(userId, dto);
  }

  @Post('disable')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Desactivar el 2FA',
    description: 'Requiere la contraseña actual.',
  })
  @ApiOkResponse({
    description: '2FA desactivado',
    type: TwoFactorStatusResponseDto,
  })
  @ApiBadRequestResponse({ description: 'El 2FA no está activo' })
  @ApiUnauthorizedResponse({
    description: 'Token JWT ausente/inválido o contraseña incorrecta',
  })
  disable(@Req() req: Request, @Body() dto: DisableTwoFactorDto) {
    const userId = (req.user as { userId: string }).userId;
    return this.twoFactorService.disable(userId, dto);
  }
}
