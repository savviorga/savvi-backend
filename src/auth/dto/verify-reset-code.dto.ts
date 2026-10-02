import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, Matches } from 'class-validator';

export class VerifyResetCodeDto {
  @ApiProperty({
    description: 'Correo electrónico al que se envió el código',
    example: 'juan.perez@savvi.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'El email no es válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;

  @ApiProperty({
    description: 'Código de 6 dígitos recibido por email',
    example: '482913',
  })
  @Matches(/^\d{6}$/, { message: 'El código debe tener 6 dígitos' })
  code: string;
}
