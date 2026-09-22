import apiClient from './client';

/**
 * Получает список постоянных наград
 *
 * API endpoint: GET /reward/v1/list
 *
 * @returns {Promise} Промис с обёрткой { isSuccess, data, errorMessage }
 */
export const getRewards = async () => {
  try {
    const response = await apiClient.get('/reward/v1/list');
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении списка наград:', error);
    throw error;
  }
};

/**
 * Получает награду по идентификатору
 *
 * API endpoint: GET /reward/v1/{id}
 *
 * @param {number} id - Идентификатор награды
 * @returns {Promise} Промис с обёрткой { isSuccess, data, errorMessage }
 */
export const getReward = async (id) => {
  try {
    const response = await apiClient.get(`/reward/v1/${id}`);
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении награды:', error);
    throw error;
  }
};

/**
 * Создаёт постоянную награду
 *
 * API endpoint: POST /reward/v1
 *
 * @param {Object} rewardData - Данные награды
 * @param {string} rewardData.name - Название (обязательно)
 * @param {string} [rewardData.description] - Описание
 * @param {number} rewardData.cost - Цена в монетах (обязательно, >= 1)
 * @param {string} rewardData.priority - Приоритет (HIGH, MIDDLE, LOW) — обязательно
 * @returns {Promise} Промис с обёрткой { isSuccess, data, errorMessage }
 */
export const createReward = async (rewardData) => {
  try {
    const response = await apiClient.post('/reward/v1', {
      name: rewardData.name,
      description: rewardData.description || null,
      cost: rewardData.cost,
      priority: rewardData.priority
    });
    return response.data;
  } catch (error) {
    console.error('Ошибка при создании награды:', error);
    throw error;
  }
};

/**
 * Обновляет постоянную награду
 *
 * API endpoint: PUT /reward/v1/{id}
 *
 * @param {number} id - Идентификатор награды
 * @param {Object} rewardData - Новые данные награды (см. createReward)
 * @returns {Promise} Промис с обёрткой { isSuccess, data, errorMessage }
 */
export const updateReward = async (id, rewardData) => {
  try {
    const response = await apiClient.put(`/reward/v1/${id}`, {
      name: rewardData.name,
      description: rewardData.description || null,
      cost: rewardData.cost,
      priority: rewardData.priority
    });
    return response.data;
  } catch (error) {
    console.error('Ошибка при обновлении награды:', error);
    throw error;
  }
};

/**
 * Удаляет постоянную награду
 *
 * API endpoint: DELETE /reward/v1/{id}
 *
 * @param {number} id - Идентификатор награды
 * @returns {Promise} Промис с обёрткой { isSuccess, data, errorMessage }
 */
export const deleteReward = async (id) => {
  try {
    const response = await apiClient.delete(`/reward/v1/${id}`);
    return response.data;
  } catch (error) {
    console.error('Ошибка при удалении награды:', error);
    throw error;
  }
};

/**
 * Покупает постоянную награду за монеты (можно покупать многократно)
 *
 * API endpoint: POST /reward/v1/{id}/buy
 *
 * @param {number} id - Идентификатор награды
 * @returns {Promise} Промис с обёрткой { isSuccess, data, errorMessage }
 */
export const buyReward = async (id) => {
  try {
    const response = await apiClient.post(`/reward/v1/${id}/buy`);
    return response.data;
  } catch (error) {
    console.error('Ошибка при покупке награды:', error);
    throw error;
  }
};
