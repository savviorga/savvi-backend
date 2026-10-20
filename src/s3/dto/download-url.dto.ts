import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class DownloadUrlQueryDto {
  @ApiProperty({
    description: 'Key completa del archivo (debe estar en users/<userId>/)',
    example:
      'users/3634ec95-8ea0-43d6-81ad-f309de27363d/savvi-ia/9f2b0c1e-5a7d-4c2f-9b11-6d0a3e8f4c21-recibo.jpg',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  key: string;
}
