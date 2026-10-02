export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  /** Si no se envía, se usa EMAIL_FROM. */
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string | string[];
  attachments?: EmailAttachment[];
}

export interface SendEmailResult {
  /** Id del mensaje devuelto por el proveedor. */
  id: string;
  provider: string;
}

/**
 * Contrato que debe cumplir cualquier proveedor de email (Resend, SES, SMTP...).
 * El resto de la app solo conoce esta interfaz a través de EmailService.
 */
export interface EmailProvider {
  readonly name: string;
  send(options: SendEmailOptions & { from: string }): Promise<SendEmailResult>;
}
