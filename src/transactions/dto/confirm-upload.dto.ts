import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  ValidateNested,
  ArrayMinSize,
  IsArray,
} from 'class-validator';

export class UploadedFileMetadataDto {
  @IsString({ message: 'key es requerido' })
  @IsNotEmpty()
  key: string;

  @IsString({ message: 'name es requerido' })
  @IsNotEmpty()
  name: string;

  @IsInt({ message: 'size debe ser un entero' })
  @Min(1, { message: 'size debe ser mayor a 0' })
  size: number;
}

export class ConfirmUploadDto {
  @IsString({ message: 'transactionId es requerido' })
  @IsNotEmpty()
  transactionId: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Debe incluir al menos un archivo' })
  @ValidateNested({ each: true })
  @Type(() => UploadedFileMetadataDto)
  files: UploadedFileMetadataDto[];
}
