import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import {
  TwoFactorChallenge,
  TwoFactorPurpose,
} from './entities/two-factor-challenge.entity';
import { EmailService } from '../email/email.service';
import {
  ConfirmTwoFactorDto,
  DisableTwoFactorDto,
  ResendTwoFactorDto,
  VerifyTwoFactorDto,
} from './dto/two-factor.dto';
import {
  generateOpaqueToken,
  generateOtpCode,
  minutesFromNow,
  safeEqual,
  sha256,
} from './utils/otp.util';

const CODE_TTL_MINUTES = 10;
const MAX_CODE_ATTEMPTS = 5;
/** Máximo de códigos enviados por reto (el primero + reenvíos). */
const MAX_SENDS = 5;
/** Tiempo mínimo entre dos envíos de código. */
const RESEND_COOLDOWN_SECONDS = 60;

const INVALID_CODE_MESSAGE = 'El código es inválido o expiró';
const LOGIN_EXPIRED_MESSAGE =
  'El inicio de sesión expiró. Vuelve a ingresar tu email y contraseña.';

@Injectable()
export class TwoFactorService {
  private readonly logger = new Logger(TwoFactorService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(TwoFactorChallenge)
    private readonly challengeRepository: Repository<TwoFactorChallenge>,
    private readonly emailService: EmailService,
  ) {}

  // ---------- Login ----------

  /** Crea el reto de login (la contraseña ya fue validada) y envía el código. */
  async startLoginChallenge(user: User) {
    await this.assertCooldown(user.id, 'login');
    await this.invalidateOpen(user.id, 'login');

    const twoFactorToken = generateOpaqueToken();
    await this.createAndSend(user, 'login', sha256(twoFactorToken));

    return {
      requiresTwoFactor: true as const,
      twoFactorToken,
      expiresIn: CODE_TTL_MINUTES * 60,
    };
  }

  /** Valida el código del login y devuelve el userId autenticado. */
  async verifyLogin(dto: VerifyTwoFactorDto): Promise<string> {
    const challenge = await this.findLoginChallenge(dto.twoFactorToken);
    await this.consumeCode(challenge, dto.code);
    return challenge.userId;
  }

  async resendLogin(dto: ResendTwoFactorDto) {
    const challenge = await this.findLoginChallenge(dto.twoFactorToken);
    const user = await this.findUser(challenge.userId);
    await this.resend(challenge, user);
    return {
      message: 'Te enviamos un nuevo código.',
      expiresIn: CODE_TTL_MINUTES * 60,
    };
  }

  // ---------- Activar / desactivar ----------

  async startEnable(userId: string) {
    const user = await this.findUser(userId);
    if (user.twoFactorEnabled) {
      throw new BadRequestException(
        'La verificación en dos pasos ya está activa.',
      );
    }

    await this.assertCooldown(user.id, 'enable');
    await this.invalidateOpen(user.id, 'enable');
    await this.createAndSend(user, 'enable', null);

    return {
      message: `Te enviamos un código a ${user.email}.`,
      expiresIn: CODE_TTL_MINUTES * 60,
    };
  }

  async confirmEnable(userId: string, dto: ConfirmTwoFactorDto) {
    const challenge = await this.challengeRepository.findOne({
      where: { userId, purpose: 'enable', usedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
    if (!challenge) {
      throw new BadRequestException(INVALID_CODE_MESSAGE);
    }

    await this.consumeCode(challenge, dto.code);
    await this.userRepository.update(userId, { twoFactorEnabled: true });

    this.logger.log(`2FA activado para el usuario ${userId}`);
    return {
      message: 'Verificación en dos pasos activada.',
      twoFactorEnabled: true,
    };
  }

  async disable(userId: string, dto: DisableTwoFactorDto) {
    const user = await this.findUser(userId);
    if (!user.twoFactorEnabled) {
      throw new BadRequestException(
        'La verificación en dos pasos no está activa.',
      );
    }
    if (!(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('La contraseña es incorrecta');
    }

    await this.userRepository.update(userId, { twoFactorEnabled: false });
    await this.invalidateOpen(userId);

    this.logger.log(`2FA desactivado para el usuario ${userId}`);
    return {
      message: 'Verificación en dos pasos desactivada.',
      twoFactorEnabled: false,
    };
  }

  // ---------- Internos ----------

  private async findUser(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }

  private async findLoginChallenge(
    twoFactorToken: string,
  ): Promise<TwoFactorChallenge> {
    const challenge = await this.challengeRepository.findOne({
      where: {
        tokenHash: sha256(twoFactorToken),
        purpose: 'login',
        usedAt: IsNull(),
      },
    });
    if (!challenge || challenge.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException(LOGIN_EXPIRED_MESSAGE);
    }
    return challenge;
  }

  /** Impide enviar otro código antes de RESEND_COOLDOWN_SECONDS. */
  private async assertCooldown(userId: string, purpose: TwoFactorPurpose) {
    const latest = await this.challengeRepository.findOne({
      where: { userId, purpose, usedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
    if (latest) {
      this.assertChallengeCooldown(latest);
    }
  }

  private assertChallengeCooldown(challenge: TwoFactorChallenge) {
    const elapsed = (Date.now() - challenge.lastSentAt.getTime()) / 1000;
    if (elapsed < RESEND_COOLDOWN_SECONDS) {
      const wait = Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed);
      throw new HttpException(
        `Espera ${wait} segundos antes de pedir otro código.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private async invalidateOpen(userId: string, purpose?: TwoFactorPurpose) {
    await this.challengeRepository.update(
      { userId, usedAt: IsNull(), ...(purpose ? { purpose } : {}) },
      { usedAt: new Date() },
    );
  }

  private async createAndSend(
    user: User,
    purpose: TwoFactorPurpose,
    tokenHash: string | null,
  ) {
    const code = generateOtpCode();
    const challenge = await this.challengeRepository.save(
      this.challengeRepository.create({
        userId: user.id,
        purpose,
        codeHash: sha256(code),
        tokenHash,
        expiresAt: minutesFromNow(CODE_TTL_MINUTES),
        lastSentAt: new Date(),
      }),
    );

    try {
      await this.sendCode(user, code, purpose);
    } catch (error) {
      // Sin email enviado el reto no sirve; lo borramos para no bloquear el reintento
      await this.challengeRepository.delete(challenge.id);
      throw error;
    }
  }

  private async resend(challenge: TwoFactorChallenge, user: User) {
    this.assertChallengeCooldown(challenge);

    if (challenge.sendCount >= MAX_SENDS) {
      await this.challengeRepository.update(challenge.id, {
        usedAt: new Date(),
      });
      throw new BadRequestException(
        'Alcanzaste el límite de reenvíos. Vuelve a iniciar sesión.',
      );
    }

    // Reemplaza el código; la condición sobre send_count evita dos reenvíos simultáneos
    const code = generateOtpCode();
    const { affected } = await this.challengeRepository.update(
      { id: challenge.id, usedAt: IsNull(), sendCount: challenge.sendCount },
      {
        codeHash: sha256(code),
        attempts: 0,
        expiresAt: minutesFromNow(CODE_TTL_MINUTES),
        lastSentAt: new Date(),
        sendCount: challenge.sendCount + 1,
      },
    );
    if (!affected) {
      throw new HttpException(
        'Ya se está enviando un código. Espera un momento.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    await this.sendCode(user, code, challenge.purpose);
  }

  private async sendCode(user: User, code: string, purpose: TwoFactorPurpose) {
    await this.emailService.sendTwoFactorCode(user.email, {
      name: user.name,
      code,
      expiresInMinutes: CODE_TTL_MINUTES,
      purpose,
    });
  }

  /**
   * Verifica el código y marca el reto como usado. Cuenta el intento de forma
   * atómica antes de comparar para frenar la fuerza bruta en paralelo.
   */
  private async consumeCode(challenge: TwoFactorChallenge, code: string) {
    if (challenge.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException(INVALID_CODE_MESSAGE);
    }

    const tooManyAttempts = async () => {
      await this.challengeRepository.update(challenge.id, {
        usedAt: new Date(),
      });
      return new BadRequestException(
        challenge.purpose === 'login'
          ? 'Demasiados intentos. Vuelve a iniciar sesión.'
          : 'Demasiados intentos. Solicita un nuevo código.',
      );
    };

    const { affected: counted } = await this.challengeRepository
      .createQueryBuilder()
      .update()
      .set({ attempts: () => 'attempts + 1' })
      .where('id = :id AND attempts < :max', {
        id: challenge.id,
        max: MAX_CODE_ATTEMPTS,
      })
      .execute();
    if (!counted) {
      throw await tooManyAttempts();
    }

    if (!safeEqual(sha256(code), challenge.codeHash)) {
      const remaining = MAX_CODE_ATTEMPTS - (challenge.attempts + 1);
      if (remaining <= 0) {
        throw await tooManyAttempts();
      }
      throw new BadRequestException(
        `Código incorrecto. Te quedan ${remaining} intentos.`,
      );
    }

    // Un solo uso: si otra petición lo consumió antes, se rechaza
    const { affected: used } = await this.challengeRepository.update(
      { id: challenge.id, usedAt: IsNull() },
      { usedAt: new Date() },
    );
    if (!used) {
      throw new BadRequestException(INVALID_CODE_MESSAGE);
    }
  }
}
