import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import {
  EmailProvider,
  SendEmailOptions,
  SendEmailResult,
} from '../interfaces/email-provider.interface';

@Injectable()
export class ResendEmailProvider implements EmailProvider {
  readonly name = 'resend';
  private readonly logger = new Logger(ResendEmailProvider.name);
  private readonly client: Resend | null;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      this.logger.warn(
        'RESEND_API_KEY no está configurada; el envío de emails fallará.',
      );
    }
    this.client = apiKey ? new Resend(apiKey) : null;
  }

  async send(
    options: SendEmailOptions & { from: string },
  ): Promise<SendEmailResult> {
    if (!this.client) {
      throw new Error('RESEND_API_KEY no está configurada');
    }

    const { data, error } = await this.client.emails.send({
      from: options.from,
      to: options.to,
      subject: options.subject,
      // html o text ya fue validado en EmailService
      html: options.html as string,
      text: options.text,
      cc: options.cc,
      bcc: options.bcc,
      replyTo: options.replyTo,
      attachments: options.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
      })),
    });

    if (error) {
      throw new Error(`Resend (${error.name}): ${error.message}`);
    }

    return { id: data.id, provider: this.name };
  }
}
