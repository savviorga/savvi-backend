import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';

/**
 * Las keys de S3 las genera siempre el servidor dentro del prefijo del usuario
 * (`users/<userId>/<módulo>/<uuid>-<nombre>`). Como solo se firman subidas a
 * ese prefijo, una key bajo `users/<userId>/` prueba que el archivo es suyo.
 */

export const UPLOAD_MODULES = ['transactions', 'savvi-ia'] as const;
export type UploadModule = (typeof UPLOAD_MODULES)[number];

/** Vigencia de una URL prefirmada de subida. */
export const UPLOAD_URL_TTL_SECONDS = 300;

const MAX_FILE_NAME_LENGTH = 120;

/**
 * El cliente manda `transactions/<id>` o `savvi-ia`: solo cuenta el primer
 * segmento y debe estar en la lista blanca.
 */
export function resolveUploadModule(folder?: string | null): UploadModule {
  const module = (folder ?? 'transactions').split('/')[0].trim();
  const found = UPLOAD_MODULES.find((m) => m === module);
  if (!found) {
    throw new BadRequestException(
      `Carpeta no permitida: ${module}. Permitidas: ${UPLOAD_MODULES.join(', ')}`,
    );
  }
  return found;
}

/** Nombre seguro para la key: sin rutas, solo caracteres ASCII simples. */
export function sanitizeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? '';
  const clean = base
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9._-]+/g, '_')
    .replace(/^[._]+/, '')
    .slice(-MAX_FILE_NAME_LENGTH);
  return clean || 'archivo';
}

export const userPrefix = (userId: string) => `users/${userId}/`;

export function buildUserKey(
  userId: string,
  module: UploadModule,
  fileName: string,
): string {
  return `${userPrefix(userId)}${module}/${randomUUID()}-${sanitizeFileName(fileName)}`;
}

/** `true` si la key está dentro del prefijo del usuario (y del módulo, si se indica). */
export function isUserKey(
  userId: string,
  key: string,
  module?: UploadModule,
): boolean {
  if (key.includes('..') || key.includes('//')) return false;
  const prefix = `${userPrefix(userId)}${module ? `${module}/` : ''}`;
  return key.startsWith(prefix) && key.length > prefix.length;
}
