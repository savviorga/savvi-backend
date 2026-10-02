import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { PasswordResetService } from './password-reset.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyResetCodeDto } from './dto/verify-reset-code.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import {
  LoginResponseDto,
  TwoFactorChallengeResponseDto,
} from './dto/two-factor-response.dto';
import {
  MessageResponseDto,
  VerifyResetCodeResponseDto,
} from './dto/password-reset-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordResetService: PasswordResetService,
  ) {}

  @Post('register')
  @ApiOperation({
    summary: 'Registrar un nuevo usuario',
    description:
      'Crea un nuevo usuario y devuelve el usuario creado junto a un JWT listo para usar como Bearer token.',
  })
  @ApiCreatedResponse({
    description: 'Usuario creado correctamente',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos (validación fallida)',
  })
  @ApiConflictResponse({ description: 'Ya existe un usuario con ese email' })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Iniciar sesión',
    description:
      'Autentica al usuario y devuelve un JWT. Si tiene la verificación en dos pasos activa, en lugar del JWT envía un código al email y devuelve `requiresTwoFactor: true` con un `twoFactorToken` para completar en POST /auth/2fa/verify.',
  })
  @ApiExtraModels(LoginResponseDto, TwoFactorChallengeResponseDto)
  @ApiOkResponse({
    description:
      'Login exitoso (`requiresTwoFactor: false`) o código 2FA enviado (`requiresTwoFactor: true`)',
    schema: {
      oneOf: [
        { $ref: getSchemaPath(LoginResponseDto) },
        { $ref: getSchemaPath(TwoFactorChallengeResponseDto) },
      ],
    },
  })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  @ApiUnauthorizedResponse({ description: 'Email o contraseña incorrectos' })
  @ApiTooManyRequestsResponse({
    description: 'Con 2FA: ya se envió un código hace menos de 60 s',
  })
  @ApiInternalServerErrorResponse({
    description: 'Con 2FA: no se pudo enviar el email',
  })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Solicitar código de recuperación de contraseña',
    description:
      'Envía un código de 6 dígitos al email (vence en 15 min). Responde lo mismo exista o no la cuenta. Si se pide de nuevo antes de 60 s, no se reenvía.',
  })
  @ApiOkResponse({
    description: 'Solicitud recibida',
    type: MessageResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Email inválido' })
  @ApiInternalServerErrorResponse({ description: 'No se pudo enviar el email' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.passwordResetService.requestReset(dto);
  }

  @Post('verify-reset-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verificar código de recuperación',
    description:
      'Valida el código recibido por email (máx. 5 intentos) y devuelve un resetToken de un solo uso, válido por 15 min.',
  })
  @ApiOkResponse({
    description: 'Código válido',
    type: VerifyResetCodeResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Código incorrecto, expirado o demasiados intentos',
  })
  verifyResetCode(@Body() dto: VerifyResetCodeDto) {
    return this.passwordResetService.verifyCode(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Restablecer contraseña',
    description:
      'Cambia la contraseña usando el resetToken de /auth/verify-reset-code. El token queda invalidado tras usarse.',
  })
  @ApiOkResponse({
    description: 'Contraseña actualizada',
    type: MessageResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Token inválido, expirado o ya usado; o contraseña inválida',
  })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.passwordResetService.resetPassword(dto);
  }
}
