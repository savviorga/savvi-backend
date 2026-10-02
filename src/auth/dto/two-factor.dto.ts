import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

const twoFactorTokenProperty = {
  description:
    'Token devuelto por POST /auth/login cuando requiresTwoFactor es true',
  example: '9c41e2...b7a0',
};

const codeProperty = {
  description: 'Código de 6 dígitos recibido por email',
  example: '482913',
};

export class VerifyTwoFactorDto {
  @ApiProperty(twoFactorTokenProperty)
  @IsString()
  @IsNotEmpty({ message: 'El twoFactorToken es requerido' })
  twoFactorToken: string;

  @ApiProperty(codeProperty)
  @Matches(/^\d{6}$/, { message: 'El código debe tener 6 dígitos' })
  code: string;
}

export class ResendTwoFactorDto {
  @ApiProperty(twoFactorTokenProperty)
  @IsString()
  @IsNotEmpty({ message: 'El twoFactorToken es requerido' })
  twoFactorToken: string;
}

export class ConfirmTwoFactorDto {
  @ApiProperty(codeProperty)
  @Matches(/^\d{6}$/, { message: 'El código debe tener 6 dígitos' })
  code: string;
}

export class DisableTwoFactorDto {
  @ApiProperty({
    description: 'Contraseña actual, para confirmar la desactivación',
    example: 'MiClave123',
    format: 'password',
  })
  @IsString()
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  password: string;
}
