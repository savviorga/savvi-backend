import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { EMAIL_PROVIDER } from './email.constants';
import type {
  EmailProvider,
  SendEmailOptions,
  SendEmailResult,
} from './interfaces/email-provider.interface';
import {
  PasswordResetCodeTemplateData,
  passwordResetCodeTemplate,
} from './templates/password-reset-code.template';
import {
  TwoFactorCodeTemplateData,
  twoFactorCodeTemplate,
} from './templates/two-factor-code.template';

/**
 * Punto de entrada único para enviar emails. No depende de ningún proveedor
 * concreto: delega en el EmailProvider configurado con EMAIL_PROVIDER.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly defaultFrom = process.env.EMAIL_FROM;

  constructor(
    @Inject(EMAIL_PROVIDER) private readonly provider: EmailProvider,
  ) {}

  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    if (!options.html && !options.text) {
      throw new BadRequestException('El email debe incluir html o text');
    }

    const from = options.from ?? this.defaultFrom;
    if (!from) {
      throw new InternalServerErrorException(
        'No hay remitente: envía "from" o configura EMAIL_FROM',
      );
    }

    try {
      const result = await this.provider.send({ ...options, from });
      this.logger.log(
        `Email enviado vía ${result.provider} (id: ${result.id}) a ${[options.to].flat().join(', ')}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Error enviando email vía ${this.provider.name}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InternalServerErrorException({
        message: 'Error al enviar el email',
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  }

  sendPasswordResetCode(
    to: string,
    data: PasswordResetCodeTemplateData,
  ): Promise<SendEmailResult> {
    return this.send({ to, ...passwordResetCodeTemplate(data) });
  }

  sendTwoFactorCode(
    to: string,
    data: TwoFactorCodeTemplateData,
  ): Promise<SendEmailResult> {
    return this.send({ to, ...twoFactorCodeTemplate(data) });
  }
}
