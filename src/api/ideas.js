import apiClient from './client';

/**
 * Получает список идей
 *
 * API endpoint: GET /api/idea/v1/list
 *
 * Бэкенд возвращает идеи, отсортированные по дате создания (сначала новые).
 *
 * @returns {Promise} Промис с данными от сервера
 */
export const getAllIdeas = async () => {
  try {
    const response = await apiClient.get('/idea/v1/list');
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении списка идей:', error);
    throw error;
  }
};

/**
 * Создаёт новую идею
 *
 * API endpoint: POST /api/idea/v1
 *
 * @param {Object} ideaData - Данные для создания идеи
 * @param {string} ideaData.name - Название идеи (обязательно)
 * @param {string} [ideaData.description] - Текстовое описание
 * @returns {Promise} Промис с данными от сервера
 */
export const createIdea = async (ideaData) => {
  try {
    const requestBody = {
      name: ideaData.name,
      description: ideaData.description || null
    };

    const response = await apiClient.post('/idea/v1', requestBody);
    return response.data;
  } catch (error) {
    console.error('Ошибка при создании идеи:', error);
    throw error;
  }
};

/**
 * Обновляет идею
 *
 * API endpoint: PUT /api/idea/v1/{id}
 *
 * @param {number} id - ID идеи
 * @param {Object} ideaData - Данные для обновления
 * @param {string} ideaData.name - Название идеи
 * @param {string} [ideaData.description] - Текстовое описание
 * @returns {Promise} Промис с данными от сервера
 */
export const updateIdea = async (id, ideaData) => {
  try {
    const requestBody = {
      name: ideaData.name,
      description: ideaData.description || null
    };

    const response = await apiClient.put(`/idea/v1/${id}`, requestBody);
    return response.data;
  } catch (error) {
    console.error('Ошибка при обновлении идеи:', error);
    throw error;
  }
};

/**
 * Удаляет идею
 *
 * API endpoint: DELETE /api/idea/v1/{id}
 *
 * @param {number} id - ID идеи для удаления
 * @returns {Promise} Промис с данными от сервера
 */
export const deleteIdea = async (id) => {
  try {
    const response = await apiClient.delete(`/idea/v1/${id}`);
    return response.data;
  } catch (error) {
    console.error('Ошибка при удалении идеи:', error);
    throw error;
  }
};
