import { describe, it, expect } from 'vitest';
import {
  DEFAULT_FIRST_DAY_OF_WEEK,
  firstDayIndex,
  isoOf,
  startOfWeek,
  weekRange,
  weekdayLabels
} from '../week.js';

describe('utils/week.js', () => {
  it('по умолчанию первая неделя начинается с воскресенья', () => {
    expect(DEFAULT_FIRST_DAY_OF_WEEK).toBe('SUNDAY');
  });

  it('firstDayIndex: SUNDAY -> 0, MONDAY -> 1', () => {
    expect(firstDayIndex('SUNDAY')).toBe(0);
    expect(firstDayIndex('MONDAY')).toBe(1);
  });

  it('startOfWeek с воскресенья возвращает воскресенье той же недели', () => {
    // 2026-09-23 — среда
    const start = startOfWeek(new Date(2026, 8, 23), 'SUNDAY');

    expect(isoOf(start)).toBe('2026-09-20');
    expect(start.getDay()).toBe(0);
  });

  it('startOfWeek с понедельника возвращает понедельник', () => {
    const start = startOfWeek(new Date(2026, 8, 23), 'MONDAY');

    expect(isoOf(start)).toBe('2026-09-21');
    expect(start.getDay()).toBe(1);
  });

  it('weekRange отдаёт воскресенье–субботу при SUNDAY', () => {
    expect(weekRange(new Date(2026, 8, 23), 'SUNDAY')).toEqual({
      start: '2026-09-20',
      end: '2026-09-26'
    });
  });

  it('weekRange отдаёт понедельник–воскресенье при MONDAY', () => {
    expect(weekRange(new Date(2026, 8, 23), 'MONDAY')).toEqual({
      start: '2026-09-21',
      end: '2026-09-27'
    });
  });

  it('weekdayLabels по умолчанию начинаются с Вс', () => {
    expect(weekdayLabels()).toEqual(['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']);
  });

  it('weekdayLabels при MONDAY начинаются с Пн', () => {
    expect(weekdayLabels('MONDAY')).toEqual(['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']);
  });
});
