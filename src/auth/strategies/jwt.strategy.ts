import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { getJwtSecret } from '../../config/env';
import type { SessionClaims } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getJwtSecret(),
    });
  }

  async validate(payload: Partial<SessionClaims> & { iat?: number }) {
    const userId = payload?.sub;
    if (!userId) throw new UnauthorizedException('Token inválido');

    // Asegura que el usuario exista y que el token no se haya revocado
    // (cambio de contraseña, recuperación, 2FA o email suben tokenVersion).
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: { id: true, tokenVersion: true },
    });
    if (!user) throw new UnauthorizedException('Usuario no encontrado');
    if ((payload.ver ?? 0) !== user.tokenVersion) {
      throw new UnauthorizedException('Token inválido');
    }

    return { userId: user.id, authTime: payload.auth_time ?? payload.iat };
  }
}
