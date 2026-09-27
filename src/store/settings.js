import { reactive } from 'vue';
import { getAppSettings, updateAppSettings } from '../api/settings.js';
import { DEFAULT_FIRST_DAY_OF_WEEK } from '../utils/week.js';

const state = reactive({
  firstDayOfWeek: DEFAULT_FIRST_DAY_OF_WEEK,
  loading: false,
  loaded: false,
  error: null
});

let loadPromise = null;

export function useSettings() {
  return state;
}

/**
 * Загружает настройки приложения один раз (или принудительно), кеширует результат.
 */
export function loadSettings(force = false) {
  if (state.loaded && !force) {
    return Promise.resolve(state);
  }
  if (loadPromise) {
    return loadPromise;
  }
  loadPromise = (async () => {
    state.loading = true;
    state.error = null;
    try {
      const response = await getAppSettings();
      if (response.isSuccess && response.data?.firstDayOfWeek) {
        state.firstDayOfWeek = response.data.firstDayOfWeek;
      }
      state.loaded = true;
    } catch (error) {
      console.error('Ошибка загрузки настроек приложения:', error);
      state.error = 'Не удалось загрузить настройки';
    } finally {
      state.loading = false;
      loadPromise = null;
    }
    return state;
  })();
  return loadPromise;
}

/**
 * Сохраняет первый день недели и обновляет стор.
 */
export async function saveFirstDayOfWeek(firstDayOfWeek) {
  const response = await updateAppSettings({ firstDayOfWeek });
  if (response.isSuccess && response.data?.firstDayOfWeek) {
    state.firstDayOfWeek = response.data.firstDayOfWeek;
    state.loaded = true;
  }
  return response;
}

/**
 * Сбрасывает стор (используется в тестах).
 */
export function resetSettings() {
  state.firstDayOfWeek = DEFAULT_FIRST_DAY_OF_WEEK;
  state.loading = false;
  state.loaded = false;
  state.error = null;
  loadPromise = null;
}
