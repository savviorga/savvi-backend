import {
  currentMonthInBogota,
  startOfBogotaDay,
  startOfBogotaMonth,
  todayInBogota,
} from './bogota-time';

describe('bogota-time', () => {
  it('a las 10 p. m. en Colombia sigue siendo el mismo día aunque en UTC sea el siguiente', () => {
    const now = new Date('2026-10-21T03:00:00Z'); // 20-oct 22:00 en Bogotá
    expect(todayInBogota(now)).toBe('2026-10-20');
    expect(startOfBogotaDay(now).toISOString()).toBe(
      '2026-10-20T05:00:00.000Z',
    );
  });

  it('el mes cambia a la medianoche de Colombia', () => {
    const lastNight = new Date('2026-11-01T04:59:00Z'); // 31-oct 23:59
    expect(currentMonthInBogota(lastNight)).toEqual({ year: 2026, month: 10 });
    expect(startOfBogotaMonth(lastNight).toISOString()).toBe(
      '2026-10-01T05:00:00.000Z',
    );
  });
});
