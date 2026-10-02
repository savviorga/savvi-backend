import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Token devuelto por POST /auth/verify-reset-code',
    example: '3f9a1c...e07b',
  })
  @IsString()
  @IsNotEmpty({ message: 'El token de recuperación es requerido' })
  resetToken: string;

  @ApiProperty({
    description: 'Nueva contraseña (mínimo 6 caracteres)',
    example: 'MiClaveNueva456',
    minLength: 6,
    format: 'password',
  })
  @IsString()
  @IsNotEmpty({ message: 'La nueva contraseña es requerida' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  newPassword: string;
}
