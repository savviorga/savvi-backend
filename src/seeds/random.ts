/**
 * Generador pseudoaleatorio determinista.
 *
 * Usamos una semilla fija para que `npm run seed` produzca SIEMPRE el mismo
 * conjunto de datos: así el equipo comparte los mismos escenarios y los
 * reportes/gráficas son reproducibles entre entornos.
 */

const SEED = 20260918;

let state = SEED;

/** Reinicia la secuencia al valor inicial (lo llama el seeder al arrancar). */
export function resetRandom(): void {
  state = SEED;
}

/** mulberry32: rápido, determinista y suficiente para datos de prueba. */
export function random(): number {
  state |= 0;
  state = (state + 0x6d2b79f5) | 0;
  let t = Math.imul(state ^ (state >>> 15), 1 | state);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Entero entre min y max, ambos incluidos. */
export function intBetween(min: number, max: number): number {
  return Math.floor(random() * (max - min + 1)) + min;
}

/** Monto en pesos redondeado a la centena más cercana (como se ve en la vida real). */
export function moneyBetween(min: number, max: number): number {
  const value = random() * (max - min) + min;
  return Math.round(value / 100) * 100;
}

export function pick<T>(items: readonly T[]): T {
  return items[Math.floor(random() * items.length)];
}

export function pickMany<T>(items: readonly T[], count: number): T[] {
  const pool = [...items];
  const result: T[] = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    result.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
  }
  return result;
}

/** Elige un elemento respetando el campo `weight` (frecuencia relativa). */
export function pickWeighted<T extends { weight: number }>(
  items: readonly T[],
): T {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let threshold = random() * total;
  for (const item of items) {
    threshold -= item.weight;
    if (threshold <= 0) return item;
  }
  return items[items.length - 1];
}

/** true con la probabilidad indicada (0..1). */
export function chance(probability: number): boolean {
  return random() < probability;
}

// ---------------------------------------------------------------------------
// Fechas
// ---------------------------------------------------------------------------

/** Fecha local sin hora: evita corrimientos de día al guardar columnas `date`. */
export function dateOf(year: number, month: number, day: number): Date {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(day, lastDay));
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function addMonths(date: Date, months: number): Date {
  const copy = new Date(date);
  copy.setMonth(copy.getMonth() + months);
  return copy;
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** Clave 'YYYY-MM' para agrupar por mes. */
export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function isSameOrBefore(a: Date, b: Date): boolean {
  return a.getTime() <= b.getTime();
}

/** Divide un arreglo en bloques (para inserciones por lotes). */
export function chunk<T>(items: T[], size: number): T[][] {
  const blocks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    blocks.push(items.slice(i, i + size));
  }
  return blocks;
}
