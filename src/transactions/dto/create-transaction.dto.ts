import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class CreateTransactionDto {
  @IsDateString()
  date: string; // se guarda como string ISO, luego TypeORM lo convierte a Date

  @IsString()
  type: string; // o enum si quieres mayor control

  @IsNumber()
  amount: number;

  @IsString()
  category: string;

  @IsString()
  account: string;

  @IsOptional()
  @IsString()
  description?: string;
}
