export const APP_TIMEZONE = import.meta.env.VITE_APP_TIMEZONE || 'Europe/Moscow'
export const APP_TIMEZONE_OFFSET = import.meta.env.VITE_APP_TIMEZONE_OFFSET || '+03:00'

/**
 * Форматирует ISO-строку даты для отображения в настроенной таймзоне.
 */
export function formatDateInTz(dateString, timezone = APP_TIMEZONE) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', {
    timeZone: timezone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Возвращает текущую дату-время в заданной таймзоне как ISO-подобную строку с оффсетом.
 * Пример: "2026-06-11T15:30:00+03:00"
 */
export function nowISOStringWithTz(timezone = APP_TIMEZONE, offset = APP_TIMEZONE_OFFSET) {
  const str = new Date().toLocaleString('sv-SE', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
  return str.replace(' ', 'T') + offset
}

/**
 * Конструирует ISO-подобную строку с оффсетом из отдельной даты и времени.
 * datePart: "2026-06-11", timePart: "15:30" → "2026-06-11T15:30:00+03:00"
 */
export function buildISOStringWithTz(datePart, timePart, offset = APP_TIMEZONE_OFFSET) {
  return `${datePart}T${timePart}:00${offset}`
}
