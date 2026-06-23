import { ApiProperty } from '@nestjs/swagger';
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
  @ApiProperty({
    description: 'Key del objeto almacenado en S3',
    example: 'uploads/1714000000000-factura.pdf',
  })
  @IsString({ message: 'key es requerido' })
  @IsNotEmpty()
  key: string;

  @ApiProperty({
    description: 'Nombre original del archivo',
    example: 'factura-abril.pdf',
  })
  @IsString({ message: 'name es requerido' })
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Tamaño del archivo en bytes',
    example: 245678,
    minimum: 1,
  })
  @IsInt({ message: 'size debe ser un entero' })
  @Min(1, { message: 'size debe ser mayor a 0' })
  size: number;
}

export class ConfirmUploadDto {
  @ApiProperty({
    description: 'ID de la transacción a la que se vincularán los archivos',
    example: 'a0e1b4c6-2d6a-4a70-a7aa-12e9d4c8f001',
    format: 'uuid',
  })
  @IsString({ message: 'transactionId es requerido' })
  @IsNotEmpty()
  transactionId: string;

  @ApiProperty({
    description: 'Listado de archivos subidos a S3 a confirmar',
    type: () => [UploadedFileMetadataDto],
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Debe incluir al menos un archivo' })
  @ValidateNested({ each: true })
  @Type(() => UploadedFileMetadataDto)
  files: UploadedFileMetadataDto[];
}
