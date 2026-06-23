import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateWaitingListDto {
  @ApiProperty({
    description: 'Correo electrónico del interesado (único)',
    example: 'interesado@savvi.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'El email no es válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;

  @ApiPropertyOptional({
    description: 'Comentarios o información adicional del interesado',
    example: 'Me interesa la funcionalidad de presupuestos',
    maxLength: 5000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;
}
