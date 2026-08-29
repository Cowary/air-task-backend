import apiClient from './client';

/**
 * Создаёт новую цель проекта
 *
 * API endpoint: POST /api/goal/v1
 *
 * @param {Object} goalData - Данные для создания цели
 * @param {string} goalData.name - Название цели (обязательно)
 * @param {number} goalData.projectId - ID проекта (обязательно)
 * @param {boolean} [goalData.isCompleted] - Признак выполнения цели
 * @returns {Promise} Промис с данными от сервера
 */
export const createGoal = async (goalData) => {
  try {
    const requestBody = {
      name: goalData.name,
      projectId: goalData.projectId,
      isCompleted: !!goalData.isCompleted
    };

    const response = await apiClient.post('/goal/v1', requestBody);
    return response.data;
  } catch (error) {
    console.error('Ошибка при создании цели:', error);
    throw error;
  }
};

/**
 * Обновляет существующую цель
 *
 * API endpoint: PUT /api/goal/v1/{id}
 *
 * @param {number} id - ID цели
 * @param {Object} goalData - Данные для обновления
 * @param {string} goalData.name - Название цели
 * @param {number} goalData.projectId - ID проекта
 * @param {boolean} goalData.isCompleted - Признак выполнения цели
 * @returns {Promise} Промис с данными от сервера
 */
export const updateGoal = async (id, goalData) => {
  try {
    const requestBody = {
      name: goalData.name,
      projectId: goalData.projectId,
      isCompleted: !!goalData.isCompleted
    };

    const response = await apiClient.put(`/goal/v1/${id}`, requestBody);
    return response.data;
  } catch (error) {
    console.error('Ошибка при обновлении цели:', error);
    throw error;
  }
};

/**
 * Удаляет цель
 *
 * API endpoint: DELETE /api/goal/v1/{id}
 *
 * @param {number} id - ID цели для удаления
 * @returns {Promise} Промис с данными от сервера
 */
export const deleteGoal = async (id) => {
  try {
    const response = await apiClient.delete(`/goal/v1/${id}`);
    return response.data;
  } catch (error) {
    console.error('Ошибка при удалении цели:', error);
    throw error;
  }
};

/**
 * Меняет только статус выполнения цели
 *
 * API endpoint: PATCH /api/goal/v1/{id}/status
 *
 * @param {number} id - ID цели
 * @param {boolean} isCompleted - Новый статус выполнения
 * @returns {Promise} Промис с данными от сервера
 */
export const updateGoalStatus = async (id, isCompleted) => {
  try {
    const response = await apiClient.patch(`/goal/v1/${id}/status`, {
      isCompleted: !!isCompleted
    });
    return response.data;
  } catch (error) {
    console.error('Ошибка при изменении статуса цели:', error);
    throw error;
  }
};
