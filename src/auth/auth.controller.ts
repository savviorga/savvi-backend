import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
    description: 'Autentica al usuario y devuelve un JWT.',
  })
  @ApiOkResponse({ description: 'Login exitoso', type: AuthResponseDto })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  @ApiUnauthorizedResponse({ description: 'Email o contraseña incorrectos' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
