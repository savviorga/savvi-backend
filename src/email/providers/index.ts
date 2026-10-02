import { Type } from '@nestjs/common';
import { EmailProvider } from '../interfaces/email-provider.interface';
import { ResendEmailProvider } from './resend.provider';

/**
 * Registro de proveedores disponibles, seleccionados con EMAIL_PROVIDER.
 * Para agregar uno nuevo (ej. SES): crear una clase que implemente
 * EmailProvider en esta carpeta y registrarla aquí.
 */
export const EMAIL_PROVIDERS: Record<string, Type<EmailProvider>> = {
  resend: ResendEmailProvider,
};

export const DEFAULT_EMAIL_PROVIDER = 'resend';

export function resolveEmailProvider(name?: string): Type<EmailProvider> {
  const key = (name || DEFAULT_EMAIL_PROVIDER).trim().toLowerCase();
  const provider = EMAIL_PROVIDERS[key];
  if (!provider) {
    throw new Error(
      `EMAIL_PROVIDER "${key}" no soportado. Disponibles: ${Object.keys(EMAIL_PROVIDERS).join(', ')}`,
    );
  }
  return provider;
}
