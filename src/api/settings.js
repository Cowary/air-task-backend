import apiClient from './client';

/**
 * Получает настройки приложения (первый день недели и т.п.)
 *
 * API endpoint: GET /settings/v1
 *
 * @returns {Promise} Промис с обёрткой { isSuccess, data, errorMessage }
 */
export const getAppSettings = async () => {
  try {
    const response = await apiClient.get('/settings/v1');
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении настроек приложения:', error);
    throw error;
  }
};

/**
 * Обновляет настройки приложения
 *
 * API endpoint: PUT /settings/v1
 *
 * @param {Object} settings
 * @param {string} settings.firstDayOfWeek - Первый день недели (SUNDAY | MONDAY)
 * @returns {Promise} Промис с обёрткой { isSuccess, data, errorMessage }
 */
export const updateAppSettings = async (settings) => {
  try {
    const response = await apiClient.put('/settings/v1', settings);
    return response.data;
  } catch (error) {
    console.error('Ошибка при сохранении настроек приложения:', error);
    throw error;
  }
};
