import { ApiProperty } from '@nestjs/swagger';

export class AuthUserDto {
  @ApiProperty({ description: 'ID del usuario', format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Nombre del usuario', example: 'Juan Pérez' })
  name: string;

  @ApiProperty({
    description: 'Email del usuario',
    example: 'juan.perez@savvi.com',
  })
  email: string;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  @ApiProperty({ description: 'Última actualización' })
  updatedAt: Date;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'Usuario autenticado', type: () => AuthUserDto })
  user: AuthUserDto;

  @ApiProperty({
    description: 'Token JWT (usar como Bearer token en Authorization)',
    example: 'eyJhbGciOiJIUzI1NiIs...',
  })
  access_token: string;
}
