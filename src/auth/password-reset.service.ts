import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { PasswordReset } from './entities/password-reset.entity';
import { EmailService } from '../email/email.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyResetCodeDto } from './dto/verify-reset-code.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import {
  generateOpaqueToken,
  generateOtpCode,
  minutesFromNow,
  safeEqual,
  sha256,
} from './utils/otp.util';

const CODE_TTL_MINUTES = 15;
const RESET_TOKEN_TTL_MINUTES = 15;
const MAX_CODE_ATTEMPTS = 5;
/** Tiempo mínimo entre dos envíos de código al mismo usuario. */
const RESEND_COOLDOWN_SECONDS = 60;

const INVALID_CODE_MESSAGE = 'El código es inválido o expiró';

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(PasswordReset)
    private readonly passwordResetRepository: Repository<PasswordReset>,
    private readonly emailService: EmailService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Genera un código y lo envía por email. Responde lo mismo exista o no el
   * email, para no revelar qué cuentas están registradas.
   */
  async requestReset(dto: ForgotPasswordDto) {
    const response = {
      message:
        'Si el email está registrado, recibirás un código para restablecer tu contraseña.',
    };

    const user = await this.userRepository.findOne({
      where: { email: dto.email.trim() },
    });
    if (!user) {
      return response;
    }

    const latest = await this.passwordResetRepository.findOne({
      where: { userId: user.id, usedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
    if (
      latest &&
      Date.now() - latest.createdAt.getTime() < RESEND_COOLDOWN_SECONDS * 1000
    ) {
      return response;
    }

    // Un solo código vigente por usuario
    await this.passwordResetRepository.update(
      { userId: user.id, usedAt: IsNull() },
      { usedAt: new Date() },
    );

    const code = generateOtpCode();
    const reset = await this.passwordResetRepository.save(
      this.passwordResetRepository.create({
        userId: user.id,
        codeHash: sha256(code),
        expiresAt: minutesFromNow(CODE_TTL_MINUTES),
      }),
    );

    try {
      await this.emailService.sendPasswordResetCode(user.email, {
        name: user.name,
        code,
        expiresInMinutes: CODE_TTL_MINUTES,
      });
    } catch (error) {
      // Sin email enviado el código no sirve; lo borramos para no bloquear el reintento
      await this.passwordResetRepository.delete(reset.id);
      throw error;
    }

    this.logger.log(`Código de recuperación enviado al usuario ${user.id}`);
    return response;
  }

  /**
   * Valida el código y devuelve un token de un solo uso para cambiar la
   * contraseña.
   */
  async verifyCode(dto: VerifyResetCodeDto) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email.trim() },
    });
    if (!user) {
      throw new BadRequestException(INVALID_CODE_MESSAGE);
    }

    const reset = await this.passwordResetRepository.findOne({
      where: { userId: user.id, usedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
    if (!reset || reset.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException(INVALID_CODE_MESSAGE);
    }

    // Se cuenta el intento de forma atómica antes de comparar (evita fuerza bruta en paralelo)
    const { affected } = await this.passwordResetRepository
      .createQueryBuilder()
      .update()
      .set({ attempts: () => 'attempts + 1' })
      .where('id = :id AND attempts < :max', {
        id: reset.id,
        max: MAX_CODE_ATTEMPTS,
      })
      .execute();
    if (!affected) {
      await this.passwordResetRepository.update(reset.id, {
        usedAt: new Date(),
      });
      throw new BadRequestException(
        'Demasiados intentos. Solicita un nuevo código.',
      );
    }

    if (!safeEqual(sha256(dto.code), reset.codeHash)) {
      const remaining = MAX_CODE_ATTEMPTS - (reset.attempts + 1);
      if (remaining <= 0) {
        await this.passwordResetRepository.update(reset.id, {
          usedAt: new Date(),
        });
        throw new BadRequestException(
          'Demasiados intentos. Solicita un nuevo código.',
        );
      }
      throw new BadRequestException(
        `Código incorrecto. Te quedan ${remaining} intentos.`,
      );
    }

    const resetToken = generateOpaqueToken();
    await this.passwordResetRepository.update(reset.id, {
      verifiedAt: new Date(),
      resetTokenHash: sha256(resetToken),
      resetTokenExpiresAt: minutesFromNow(RESET_TOKEN_TTL_MINUTES),
    });

    return { resetToken, expiresIn: RESET_TOKEN_TTL_MINUTES * 60 };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const reset = await this.passwordResetRepository.findOne({
      where: { resetTokenHash: sha256(dto.resetToken), usedAt: IsNull() },
    });
    if (
      !reset ||
      !reset.resetTokenExpiresAt ||
      reset.resetTokenExpiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException(
        'La solicitud de recuperación es inválida o expiró. Solicita un nuevo código.',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.dataSource.transaction(async (manager) => {
      // Marca como usada solo si nadie la usó antes (token de un solo uso)
      const { affected } = await manager.update(
        PasswordReset,
        { id: reset.id, usedAt: IsNull() },
        { usedAt: new Date() },
      );
      if (!affected) {
        throw new BadRequestException(
          'La solicitud de recuperación ya fue utilizada.',
        );
      }

      await manager.update(User, reset.userId, { password: hashedPassword });

      // Invalida cualquier otra solicitud abierta del usuario
      await manager.update(
        PasswordReset,
        { userId: reset.userId, usedAt: IsNull() },
        { usedAt: new Date() },
      );
    });

    this.logger.log(`Contraseña restablecida para el usuario ${reset.userId}`);
    return {
      message: 'Contraseña actualizada. Ya puedes iniciar sesión.',
    };
  }
}
