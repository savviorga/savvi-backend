import { ApiProperty } from '@nestjs/swagger';

export class MessageResponseDto {
  @ApiProperty({ example: 'Operación realizada correctamente' })
  message: string;
}

export class VerifyResetCodeResponseDto {
  @ApiProperty({
    description:
      'Token de un solo uso para POST /auth/reset-password. No es un JWT de sesión.',
    example: '3f9a1c...e07b',
  })
  resetToken: string;

  @ApiProperty({ description: 'Segundos de validez del token', example: 900 })
  expiresIn: number;
}
