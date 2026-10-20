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
    const result = toPublicUser(saved);
    const access_token = this.jwtService.sign({
      sub: saved.id,
      email: saved.email,
    });
    return { user: result, access_token };
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
    return { requiresTwoFactor: false as const, ...this.createSession(user) };
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

  /** Emite un JWT nuevo para un usuario con sesión vigente (sesión deslizante). */
  async refreshSession(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }
    return this.createSession(user);
  }

  private createSession(user: User) {
    const access_token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });
    return { user: toPublicUser(user), access_token };
  }

  /**
   * Valida email y contraseña. Tras MAX_FAILED_LOGINS fallos seguidos bloquea
   * el login de esa cuenta LOCK_MINUTES minutos (además del límite por IP).
   */
  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.userRepository
      .createQueryBuilder('u')
      .addSelect(['u.failedLoginAttempts', 'u.lockedUntil'])
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
    ...result
  } = user;
  return result;
}
