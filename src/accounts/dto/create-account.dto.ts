import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  MaxLength,
  Matches,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateAccountDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @MaxLength(100, { message: 'El nombre no puede exceder los 100 caracteres' })
  name: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}|[a-z]+-[0-9]+)$/, {
    message: 'El color debe ser un valor hexadecimal (#FFF o #FFFFFF) o un color de Tailwind (ej: blue-500)',
  })
  color?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean({ message: 'isActive debe ser un valor booleano' })
  isActive?: boolean;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El saldo inicial debe ser un número' })
  @Min(0, { message: 'El saldo inicial no puede ser negativo' })
  initialBalance?: number;
}
