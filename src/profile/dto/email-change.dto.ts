import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';

export class RequestEmailChangeDto {
  @ApiProperty({
    description: 'Email nuevo; se le envía un código de confirmación',
    example: 'juan.nuevo@savvi.com',
    format: 'email',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'El email no es válido' })
  newEmail: string;

  @ApiProperty({
    description: 'Contraseña actual, para confirmar que eres tú',
    format: 'password',
  })
  @IsString()
  @IsNotEmpty({ message: 'La contraseña actual es requerida' })
  currentPassword: string;
}

export class ConfirmEmailChangeDto {
  @ApiProperty({
    description: 'Código de 6 dígitos enviado al email nuevo',
    example: '482913',
  })
  @Matches(/^\d{6}$/, { message: 'El código debe tener 6 dígitos' })
  code: string;
}
