import { Throttle } from '@nestjs/throttler';

const MINUTE = 60_000;

/**
 * Límites por IP para los endpoints públicos de autenticación (más estrictos
 * que el límite global de `ThrottlerModule`). Frenan la fuerza bruta y el
 * envío masivo de emails.
 */
export const AuthThrottle = {
  /** Login y verificación de códigos. */
  strict: () => Throttle({ default: { limit: 5, ttl: MINUTE } }),
  /** Peticiones que envían un email. */
  email: () => Throttle({ default: { limit: 3, ttl: MINUTE } }),
  /** Registro de cuentas. */
  register: () => Throttle({ default: { limit: 5, ttl: 10 * MINUTE } }),
};

/** Límite global para el resto de la API (por usuario autenticado o por IP). */
export const GLOBAL_THROTTLE = { ttl: MINUTE, limit: 300 };
