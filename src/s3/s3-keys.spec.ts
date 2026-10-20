import { BadRequestException } from '@nestjs/common';
import {
  normalizeMimeType,
  buildUserKey,
  isUserKey,
  resolveUploadModule,
  sanitizeFileName,
} from './s3-keys';

describe('s3-keys', () => {
  it('toma solo el primer segmento de la carpeta y valida la lista blanca', () => {
    expect(resolveUploadModule('transactions/123')).toBe('transactions');
    expect(resolveUploadModule('savvi-ia')).toBe('savvi-ia');
    expect(resolveUploadModule(undefined)).toBe('transactions');
    expect(() => resolveUploadModule('users/otro')).toThrow(
      BadRequestException,
    );
    expect(() => resolveUploadModule('../transactions')).toThrow(
      BadRequestException,
    );
  });

  it('limpia el nombre del archivo', () => {
    expect(sanitizeFileName('../../Factura Año 2026.pdf')).toBe(
      'Factura_Ano_2026.pdf',
    );
    expect(sanitizeFileName('...')).toBe('archivo');
  });

  it('genera keys dentro del prefijo del usuario', () => {
    const key = buildUserKey('u1', 'savvi-ia', 'recibo.jpg');
    expect(key).toMatch(/^users\/u1\/savvi-ia\/[0-9a-f-]{36}-recibo\.jpg$/);
    expect(isUserKey('u1', key)).toBe(true);
    expect(isUserKey('u1', key, 'savvi-ia')).toBe(true);
    expect(isUserKey('u1', key, 'transactions')).toBe(false);
    expect(isUserKey('u2', key)).toBe(false);
    expect(isUserKey('u1', 'users/u1/../u2/x.pdf')).toBe(false);
    expect(isUserKey('u1', 'transactions/abc/x.pdf')).toBe(false);
  });

  it('normaliza el MIME de las notas de voz', () => {
    expect(normalizeMimeType('audio/webm;codecs=opus')).toBe('audio/webm');
    expect(normalizeMimeType(' Image/JPEG ')).toBe('image/jpeg');
  });
});
