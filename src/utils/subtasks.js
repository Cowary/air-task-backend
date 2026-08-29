/**
 * Утилиты для работы с шагами задачи (sub-tasks)
 */

/**
 * Нормализует список шагов: копия, сортировка по position, дефолты
 *
 * @param {Array} list
 * @returns {Array}
 */
export function normalize(list) {
  if (!Array.isArray(list)) {
    return [];
  }
  return [...list]
    .sort((a, b) => (a.position || 0) - (b.position || 0))
    .map(s => ({
      id: s.id ?? null,
      name: s.name || '',
      position: s.position ?? 0,
      isCompleted: !!s.isCompleted
    }));
}

/**
 * Преобразует список шагов в payload для API:
 * позиции всегда пересчитываются от порядка массива (1..N), дубли исключены
 *
 * @param {Array} list
 * @returns {Array}
 */
export function toPayload(list) {
  return normalize(list).map((s, i) => ({
    id: s.id ?? null,
    name: s.name.trim(),
    position: i + 1,
    isCompleted: !!s.isCompleted
  }));
}

/**
 * Считает прогресс выполнения шагов задачи
 *
 * @param {Object} task - задача с полем subTasks
 * @returns {{done: number, total: number, percent: number, allDone: boolean, label: string}|null}
 */
export function progress(task) {
  const list = task?.subTasks;
  if (!Array.isArray(list) || list.length === 0) {
    return null;
  }
  const total = list.length;
  const done = list.filter(s => s.isCompleted).length;
  return {
    done,
    total,
    percent: Math.round((done / total) * 100),
    allDone: done === total,
    label: `${done}/${total}`
  };
}

/**
 * Проверяет корректность списка шагов перед отправкой
 *
 * @param {Array} list
 * @returns {string|null} текст ошибки или null
 */
export function validate(list) {
  if (!Array.isArray(list)) {
    return null;
  }
  for (const s of list) {
    if (!s.name || !s.name.trim()) {
      return 'Название шага не может быть пустым';
    }
  }
  return null;
}