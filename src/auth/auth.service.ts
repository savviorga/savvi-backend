import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyTwoFactorDto } from './dto/two-factor.dto';
import { TwoFactorService } from './two-factor.service';
import { minutesFromNow } from './utils/otp.util';

/** Contraseñas incorrectas seguidas antes de bloquear el login. */
const MAX_FAILED_LOGINS = 10;
const LOCK_MINUTES = 15;
/** Tope absoluto de una sesión: pasado este tiempo desde el login, /auth/refresh ya no la renueva. */
const SESSION_MAX_DAYS = 30;

/** Claims propios del JWT de Savvi. */
export interface SessionClaims {
  sub: string;
  email: string;
  /** `users.tokenVersion` al emitirlo: si no coincide, el token ya no sirve. */
  ver: number;
  /** Segundos (epoch) del login original; se conserva al renovar. */
  auth_time: number;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly twoFactorService: TwoFactorService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existing = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });
    if (existing) {
      throw new ConflictException('Ya existe un usuario con este email');
    }
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = this.userRepository.create({
      name: registerDto.name,
      email: registerDto.email,
      password: hashedPassword,
    });
    const saved = await this.userRepository.save(user);
    return this.createSession(saved);
  }

  /**
   * Si el usuario tiene 2FA activo no devuelve el JWT: envía un código por
   * email y devuelve un twoFactorToken para completar en /auth/2fa/verify.
   */
  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (user.twoFactorEnabled) {
      return this.twoFactorService.startLoginChallenge(user);
    }
    return {
      requiresTwoFactor: false as const,
      ...(await this.createSession(user)),
    };
  }

  async verifyTwoFactorLogin(dto: VerifyTwoFactorDto) {
    const userId = await this.twoFactorService.verifyLogin(dto);
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }
    return this.createSession(user);
  }

  /** Datos mínimos del usuario autenticado (validación de sesión entre servicios). */
  async getSessionUser(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }
    return { id: user.id, name: user.name, email: user.email };
  }

  /**
   * Emite un JWT nuevo para un usuario con sesión vigente (sesión deslizante),
   * conservando la hora del login: pasados SESSION_MAX_DAYS hay que volver a entrar.
   */
  async refreshSession(userId: string, authTime?: number) {
    if (
      authTime &&
      Date.now() / 1000 - authTime > SESSION_MAX_DAYS * 24 * 60 * 60
    ) {
      throw new UnauthorizedException(
        'Tu sesión expiró. Vuelve a iniciar sesión.',
      );
    }
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }
    return this.createSession(user, authTime);
  }

  /**
   * Tras un cambio de seguridad (contraseña, 2FA, email) invalida todas las
   * sesiones del usuario y devuelve una nueva para quien hizo el cambio.
   */
  async rotateSession(userId: string, authTime?: number) {
    await this.userRepository.increment({ id: userId }, 'tokenVersion', 1);
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }
    return this.createSession(user, authTime);
  }

  private async createSession(user: User, authTime?: number) {
    const version =
      user.tokenVersion ??
      (
        await this.userRepository.findOne({
          where: { id: user.id },
          select: { id: true, tokenVersion: true },
        })
      )?.tokenVersion ??
      0;
    const claims: SessionClaims = {
      sub: user.id,
      email: user.email,
      ver: version,
      auth_time: authTime ?? Math.floor(Date.now() / 1000),
    };
    const access_token = this.jwtService.sign(claims);
    return { user: toPublicUser(user), access_token };
  }

  /**
   * Valida email y contraseña. Tras MAX_FAILED_LOGINS fallos seguidos bloquea
   * el login de esa cuenta LOCK_MINUTES minutos (además del límite por IP).
   */
  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.userRepository
      .createQueryBuilder('u')
      .addSelect(['u.failedLoginAttempts', 'u.lockedUntil', 'u.tokenVersion'])
      .where('u.email = :email', { email })
      .getOne();

    if (user?.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      const minutes = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / 60_000,
      );
      throw new HttpException(
        `Demasiados intentos fallidos. Intenta de nuevo en ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'} o restablece tu contraseña.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (!user || !(await bcrypt.compare(password, user.password))) {
      if (user) await this.registerFailedLogin(user);
      throw new UnauthorizedException('Email o contraseña incorrectos');
    }

    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await this.userRepository.update(user.id, {
        failedLoginAttempts: 0,
        lockedUntil: null,
      });
    }
    return user;
  }

  private async registerFailedLogin(user: User): Promise<void> {
    const attempts = (user.failedLoginAttempts ?? 0) + 1;
    await this.userRepository.update(
      user.id,
      attempts >= MAX_FAILED_LOGINS
        ? { failedLoginAttempts: 0, lockedUntil: minutesFromNow(LOCK_MINUTES) }
        : { failedLoginAttempts: attempts },
    );
  }
}

/** Usuario sin campos internos (contraseña, contadores de seguridad). */
export function toPublicUser(user: User) {
  const {
    password: _password,
    failedLoginAttempts: _failed,
    lockedUntil: _locked,
    tokenVersion: _version,
    ...result
  } = user;
  return result;
}
