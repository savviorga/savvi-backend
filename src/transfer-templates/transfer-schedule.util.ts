/**
 * Calcula la próxima fecha de vencimiento según frecuencia.
 * Para `custom`, usa `customIntervalDays` (intervalo fijo en días).
 */
export function calcNextDueDate(
  frequency: string,
  dayOfMonth: number,
  customIntervalDays?: number | null,
): Date {
  const today = new Date();
  const next = new Date(today);

  if (frequency === "custom") {
    const days =
      customIntervalDays != null && customIntervalDays > 0
        ? customIntervalDays
        : 30;
    next.setDate(today.getDate() + days);
    return next;
  }

  if (frequency === "monthly") next.setMonth(today.getMonth() + 1);
  if (frequency === "bimonthly") next.setMonth(today.getMonth() + 2);
  if (frequency === "weekly") next.setDate(today.getDate() + 7);
  if (frequency === "biweekly") next.setDate(today.getDate() + 14);

  if (["monthly", "bimonthly"].includes(frequency)) {
    const maxDay = new Date(
      next.getFullYear(),
      next.getMonth() + 1,
      0,
    ).getDate();
    next.setDate(Math.min(dayOfMonth, maxDay));
  }

  return next;
}
