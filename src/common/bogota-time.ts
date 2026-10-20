/**
 * Fechas en la zona de Colombia (UTC-5 todo el año, sin horario de verano).
 * El servidor y la base de datos corren en UTC: "hoy" y "este mes" se
 * calculan siempre aquí para no adelantarse 5 horas.
 */

export const APP_TIME_ZONE = 'America/Bogota';
const BOGOTA_OFFSET_MS = 5 * 60 * 60 * 1000;

const isoDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: APP_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Fecha `YYYY-MM-DD` en Colombia. */
export function todayInBogota(now: Date = new Date()): string {
  return isoDate.format(now);
}

/** Año y mes (1-12) en Colombia. */
export function currentMonthInBogota(now: Date = new Date()): {
  year: number;
  month: number;
} {
  const [year, month] = todayInBogota(now).split('-').map(Number);
  return { year, month };
}

/** Instante en que empezó el día de hoy en Colombia. */
export function startOfBogotaDay(now: Date = new Date()): Date {
  const [y, m, d] = todayInBogota(now).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d) + BOGOTA_OFFSET_MS);
}

/** Instante en que empezó el mes en curso en Colombia. */
export function startOfBogotaMonth(now: Date = new Date()): Date {
  const { year, month } = currentMonthInBogota(now);
  return new Date(Date.UTC(year, month - 1, 1) + BOGOTA_OFFSET_MS);
}

/** Año y mes desplazados `delta` meses (sin pasar por fechas con zona horaria). */
export function shiftMonth(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

/** `YYYY-MM-01` del mes indicado. */
export function monthStartISO(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

/** `YYYY-MM` del mes indicado. */
export function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}
