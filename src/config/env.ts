/**
 * Variables de entorno obligatorias. Se leen en tiempo de ejecución (no al
 * importar el módulo) para que `.env` ya esté cargado por `typeorm.config`.
 */

const MIN_JWT_SECRET_LENGTH = 32;

/** Secreto de firma de los JWT. Sin él la API no arranca: nunca hay valor por defecto. */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret || secret.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET no está definido o tiene menos de ${MIN_JWT_SECRET_LENGTH} caracteres. ` +
        'Genera uno con `openssl rand -base64 48` y defínelo en el entorno.',
    );
  }
  return secret;
}

/** Corta el arranque con un mensaje claro si falta alguna variable obligatoria. */
export function assertRequiredEnv(): void {
  getJwtSecret();
}
