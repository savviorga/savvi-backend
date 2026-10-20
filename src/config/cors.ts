/**
 * Orígenes del navegador que pueden llamar a la API y subir a S3.
 * `CORS_ORIGINS` es una lista separada por comas (sin barra final), p. ej.
 * `https://app.savvi.co,https://analitica.savvi.co`.
 */

const DEV_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
];

export function getCorsOrigins(): string[] {
  const origins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  if (origins.includes('*')) {
    throw new Error(
      'CORS_ORIGINS no puede ser "*": indica los dominios del frontend.',
    );
  }
  if (origins.length) return origins;

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'Falta CORS_ORIGINS: define los dominios del frontend separados por comas.',
    );
  }
  return DEV_ORIGINS;
}
