import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'Nombre completo del usuario',
    example: 'Juan Pérez',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'El nombre no puede estar vacío' })
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    description: 'Nuevo correo electrónico (debe ser único)',
    example: 'juan.perez@savvi.com',
    format: 'email',
  })
  @IsOptional()
  @IsEmail({}, { message: 'El email no es válido' })
  email?: string;
}
