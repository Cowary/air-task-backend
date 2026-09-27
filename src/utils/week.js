export const DEFAULT_FIRST_DAY_OF_WEEK = 'SUNDAY';

// Подписи дней недели, индексированные по JS Date.getDay(): 0 = воскресенье … 6 = суббота.
const WEEKDAY_LABELS_BY_JS_DAY = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

/**
 * Индекс первого дня недели в терминах Date.getDay() (0 — вс, 1 — пн).
 */
export function firstDayIndex(firstDayOfWeek) {
  return firstDayOfWeek === 'MONDAY' ? 1 : 0;
}

/**
 * Локальная дата в формате 'ГГГГ-ММ-ДД'.
 */
export function isoOf(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * Начало недели (воскресенье или понедельник) в виде объекта Date.
 */
export function startOfWeek(date, firstDayOfWeek = DEFAULT_FIRST_DAY_OF_WEEK) {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const shift = (copy.getDay() - firstDayIndex(firstDayOfWeek) + 7) % 7;
  copy.setDate(copy.getDate() - shift);
  return copy;
}

/**
 * Диапазон недели в ISO-строках: { start, end } (start … start + 6).
 */
export function weekRange(date, firstDayOfWeek = DEFAULT_FIRST_DAY_OF_WEEK) {
  const start = startOfWeek(date, firstDayOfWeek);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return { start: isoOf(start), end: isoOf(end) };
}

/**
 * Подписи дней недели, начиная с первого дня ('Пн'…'Вс' или 'Вс'…'Сб').
 */
export function weekdayLabels(firstDayOfWeek = DEFAULT_FIRST_DAY_OF_WEEK) {
  const first = firstDayIndex(firstDayOfWeek);
  return Array.from({ length: 7 }, (_, i) => WEEKDAY_LABELS_BY_JS_DAY[(first + i) % 7]);
}
