import { EmailTemplate, renderCodeEmail } from './layout';

export type TwoFactorCodePurpose = 'login' | 'enable';

export interface TwoFactorCodeTemplateData {
  name: string;
  code: string;
  expiresInMinutes: number;
  purpose: TwoFactorCodePurpose;
}

const COPY: Record<
  TwoFactorCodePurpose,
  {
    subject: string;
    eyebrow: string;
    title: string;
    titleAccent: string;
    intro: string;
    footnote: string;
  }
> = {
  login: {
    subject: 'es tu código de inicio de sesión en Savvi',
    eyebrow: 'VERIFICACIÓN EN DOS PASOS',
    title: 'Confirma que',
    titleAccent: 'eres tú.',
    intro:
      'Alguien inició sesión en tu cuenta con tu contraseña. Ingresa este código para terminar de entrar:',
    footnote:
      'Si no fuiste tú, no compartas este código y cambia tu contraseña cuanto antes.',
  },
  enable: {
    subject: 'es tu código para activar la verificación en dos pasos',
    eyebrow: 'SEGURIDAD',
    title: 'Activa la verificación',
    titleAccent: 'en dos pasos.',
    intro:
      'Ingresa este código en Savvi para activar la verificación en dos pasos. Desde ahora te pediremos un código como este cada vez que inicies sesión.',
    footnote:
      'Si no solicitaste este cambio, ignora este correo: no se activará nada.',
  },
};

export function twoFactorCodeTemplate({
  name,
  code,
  expiresInMinutes,
  purpose,
}: TwoFactorCodeTemplateData): EmailTemplate {
  const copy = COPY[purpose];

  return {
    subject: `${code} ${copy.subject}`,
    html: renderCodeEmail({
      preheader: `Tu código es ${code}. Vence en ${expiresInMinutes} minutos.`,
      eyebrow: copy.eyebrow,
      title: copy.title,
      titleAccent: copy.titleAccent,
      paragraphs: [`Hola ${name},`, copy.intro],
      code,
      expiresInMinutes,
      footnote: copy.footnote,
    }),
    text: [
      `Hola ${name},`,
      '',
      copy.intro,
      '',
      `Código: ${code}`,
      `Vence en ${expiresInMinutes} minutos.`,
      '',
      copy.footnote,
    ].join('\n'),
  };
}
