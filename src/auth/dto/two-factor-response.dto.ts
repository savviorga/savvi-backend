import { ApiProperty } from '@nestjs/swagger';
import { AuthResponseDto } from './auth-response.dto';

export class LoginResponseDto extends AuthResponseDto {
  @ApiProperty({ example: false })
  requiresTwoFactor: false;
}

export class TwoFactorChallengeResponseDto {
  @ApiProperty({ example: true })
  requiresTwoFactor: true;

  @ApiProperty({
    description:
      'Token del reto para /auth/2fa/verify y /auth/2fa/resend. No es un JWT de sesión.',
    example: '9c41e2...b7a0',
  })
  twoFactorToken: string;

  @ApiProperty({ description: 'Segundos de validez del código', example: 600 })
  expiresIn: number;
}

export class CodeSentResponseDto {
  @ApiProperty({ example: 'Te enviamos un nuevo código.' })
  message: string;

  @ApiProperty({ description: 'Segundos de validez del código', example: 600 })
  expiresIn: number;
}

export class TwoFactorStatusResponseDto {
  @ApiProperty({ example: 'Verificación en dos pasos activada.' })
  message: string;

  @ApiProperty({ example: true })
  twoFactorEnabled: boolean;
}
