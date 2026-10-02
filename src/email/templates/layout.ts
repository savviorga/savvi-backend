export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

/** Colores de marca Savvi. */
export const BRAND = {
  background: '#011627',
  surface: '#022031',
  border: '#1c3746',
  accent: '#00d4aa',
  white: '#ffffff',
  muted: '#90a1b9',
  font: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
};

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface CodeEmailLayoutData {
  /** Texto corto que muestran los clientes de correo junto al asunto. */
  preheader: string;
  /** Etiqueta en mayúsculas dentro de la píldora, ej. "SEGURIDAD". */
  eyebrow: string;
  title: string;
  /** Final del título resaltado en el color de acento. */
  titleAccent: string;
  /** Párrafos introductorios (texto plano, se escapan). */
  paragraphs: string[];
  code: string;
  expiresInMinutes: number;
  /** Nota final en gris (texto plano, se escapa). */
  footnote: string;
}

/**
 * Layout HTML de los correos con código. Usa tablas y estilos en línea para
 * que se vea igual en Gmail, Outlook y Apple Mail.
 */
export function renderCodeEmail(data: CodeEmailLayoutData): string {
  const { background, surface, border, accent, white, muted, font } = BRAND;
  const paragraphs = data.paragraphs
    .map(
      (p) =>
        `<p style="margin: 0 0 16px; font-size: 16px; line-height: 26px; color: ${muted};">${escapeHtml(p)}</p>`,
    )
    .join('');
  const digits = data.code
    .split('')
    .map(
      (d) =>
        `<td style="width: 44px; height: 56px; background: ${background}; border: 1px solid ${border}; border-radius: 10px; text-align: center; font-family: ${font}; font-size: 28px; font-weight: 700; color: ${accent};">${d}</td>`,
    )
    .join('<td style="width: 8px;"></td>');

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>Savvi</title>
</head>
<body style="margin: 0; padding: 0; background: ${background};">
<div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">${escapeHtml(data.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${background}" style="background: ${background};">
  <tr>
    <td align="center" style="padding: 40px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 520px; font-family: ${font};">
        <tr>
          <td style="padding-bottom: 32px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="44" height="44" bgcolor="${accent}" style="width: 44px; height: 44px; background: ${accent}; border-radius: 10px; text-align: center; vertical-align: middle; font-size: 22px; line-height: 44px; color: ${background};">&#9733;</td>
                <td style="padding-left: 14px; font-size: 20px; font-weight: 700; color: ${white};">Savvi</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom: 24px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background: ${surface}; border: 1px solid ${border}; border-radius: 999px; padding: 7px 14px; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; color: ${accent};">
                  <span style="color: ${accent}; font-size: 10px;">&#9679;</span>&nbsp;&nbsp;${escapeHtml(data.eyebrow)}
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom: 20px; font-size: 32px; line-height: 38px; font-weight: 800; color: ${white};">
            ${escapeHtml(data.title)} <span style="color: ${accent};">${escapeHtml(data.titleAccent)}</span>
          </td>
        </tr>
        <tr>
          <td>${paragraphs}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0 24px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${surface}" style="background: ${surface}; border: 1px solid ${border}; border-radius: 14px;">
              <tr>
                <td align="center" style="padding: 28px 16px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>${digits}</tr>
                  </table>
                  <p style="margin: 18px 0 0; font-size: 14px; color: ${muted};">Vence en <strong style="color: ${white};">${data.expiresInMinutes} minutos</strong></p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom: 32px; font-size: 14px; line-height: 22px; color: ${muted};">${escapeHtml(data.footnote)}</td>
        </tr>
        <tr>
          <td style="border-top: 1px solid ${border}; padding-top: 20px; font-size: 12px; line-height: 18px; color: ${muted};">
            Savvi &middot; Tu dinero, bajo <span style="color: ${accent};">control total.</span><br>
            Nunca te pediremos este código por teléfono ni por chat.
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}
