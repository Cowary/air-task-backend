import apiClient from './client';

/**
 * Получает список повторяющихся напоминаний
 *
 * API endpoint: GET /api/reminder/v1/list
 *
 * @param {Object} [options]
 * @param {boolean} [options.includeDeleted] - Включить мягко удалённые напоминания
 * @returns {Promise} Промис с данными от сервера
 */
export const getAllReminders = async ({ includeDeleted = false } = {}) => {
  try {
    const response = await apiClient.get('/reminder/v1/list', {
      params: includeDeleted ? { includeDeleted: true } : {}
    });
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении списка напоминаний:', error);
    throw error;
  }
};

/**
 * Получает напоминание по ID
 *
 * API endpoint: GET /api/reminder/v1/{id}
 *
 * @param {number} id - ID напоминания
 * @returns {Promise} Промис с данными от сервера
 */
export const getReminder = async (id) => {
  try {
    const response = await apiClient.get(`/reminder/v1/${id}`);
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении напоминания:', error);
    throw error;
  }
};

/**
 * Создаёт напоминание
 *
 * API endpoint: POST /api/reminder/v1
 *
 * @param {Object} data - Данные напоминания
 * @returns {Promise} Промис с данными от сервера
 */
export const createReminder = async (data) => {
  try {
    const response = await apiClient.post('/reminder/v1', {
      name: data.name,
      description: data.description || null,
      recurrenceType: data.recurrenceType,
      intervalValue: data.intervalValue ?? null,
      intervalUnit: data.intervalUnit ?? null,
      startDate: data.startDate
    });
    return response.data;
  } catch (error) {
    console.error('Ошибка при создании напоминания:', error);
    throw error;
  }
};

/**
 * Обновляет напоминание
 *
 * API endpoint: PUT /api/reminder/v1/{id}
 *
 * @param {number} id - ID напоминания
 * @param {Object} data - Данные напоминания
 * @returns {Promise} Промис с данными от сервера
 */
export const updateReminder = async (id, data) => {
  try {
    const response = await apiClient.put(`/reminder/v1/${id}`, {
      name: data.name,
      description: data.description || null,
      recurrenceType: data.recurrenceType,
      intervalValue: data.intervalValue ?? null,
      intervalUnit: data.intervalUnit ?? null,
      startDate: data.startDate
    });
    return response.data;
  } catch (error) {
    console.error('Ошибка при обновлении напоминания:', error);
    throw error;
  }
};

/**
 * Мягко удаляет напоминание (история сохраняется)
 *
 * API endpoint: DELETE /api/reminder/v1/{id}
 *
 * @param {number} id - ID напоминания
 * @returns {Promise} Промис с данными от сервера
 */
export const deleteReminder = async (id) => {
  try {
    const response = await apiClient.delete(`/reminder/v1/${id}`);
    return response.data;
  } catch (error) {
    console.error('Ошибка при удалении напоминания:', error);
    throw error;
  }
};

/**
 * Отмечает текущее наступление выполненным
 *
 * API endpoint: POST /api/reminder/v1/{id}/complete
 *
 * @param {number} id - ID напоминания
 * @param {string} [actionDate] - Дата действия ('ГГГГ-ММ-ДД'); по умолчанию — сегодня
 * @returns {Promise} Промис с данными от сервера
 */
export const completeReminder = async (id, actionDate = null) => {
  try {
    const response = await apiClient.post(`/reminder/v1/${id}/complete`, {
      actionDate: actionDate || null
    });
    return response.data;
  } catch (error) {
    console.error('Ошибка при выполнении напоминания:', error);
    throw error;
  }
};

/**
 * Пропускает текущее наступление
 *
 * API endpoint: POST /api/reminder/v1/{id}/skip
 *
 * @param {number} id - ID напоминания
 * @param {string} [actionDate] - Дата действия ('ГГГГ-ММ-ДД'); по умолчанию — сегодня
 * @returns {Promise} Промис с данными от сервера
 */
export const skipReminder = async (id, actionDate = null) => {
  try {
    const response = await apiClient.post(`/reminder/v1/${id}/skip`, {
      actionDate: actionDate || null
    });
    return response.data;
  } catch (error) {
    console.error('Ошибка при пропуске напоминания:', error);
    throw error;
  }
};

/**
 * Получает историю напоминания
 *
 * API endpoint: GET /api/reminder/v1/{id}/history
 *
 * @param {number} id - ID напоминания
 * @returns {Promise} Промис с данными от сервера
 */
export const getReminderHistory = async (id) => {
  try {
    const response = await apiClient.get(`/reminder/v1/${id}/history`);
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении истории напоминания:', error);
    throw error;
  }
};
