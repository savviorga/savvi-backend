import { EmailTemplate, renderCodeEmail } from './layout';

export interface PasswordResetCodeTemplateData {
  name: string;
  code: string;
  expiresInMinutes: number;
}

export function passwordResetCodeTemplate({
  name,
  code,
  expiresInMinutes,
}: PasswordResetCodeTemplateData): EmailTemplate {
  const intro =
    'Recibimos una solicitud para restablecer la contraseña de tu cuenta. Ingresa este código en Savvi para continuar:';
  const footnote =
    'Si no solicitaste este cambio, ignora este correo: tu contraseña seguirá siendo la misma.';

  return {
    subject: `${code} es tu código para restablecer la contraseña de Savvi`,
    html: renderCodeEmail({
      preheader: `Tu código es ${code}. Vence en ${expiresInMinutes} minutos.`,
      eyebrow: 'RECUPERAR CONTRASEÑA',
      title: 'Restablece tu',
      titleAccent: 'contraseña.',
      paragraphs: [`Hola ${name},`, intro],
      code,
      expiresInMinutes,
      footnote,
    }),
    text: [
      `Hola ${name},`,
      '',
      intro,
      '',
      `Código: ${code}`,
      `Vence en ${expiresInMinutes} minutos.`,
      '',
      footnote,
    ].join('\n'),
  };
}
