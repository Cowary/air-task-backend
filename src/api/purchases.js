import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Получает список всех покупок
 *
 * API endpoint: GET /v1/purchase/list
 *
 * @returns {Promise} Промис с данными от сервера
 */
export const getPurchases = async () => {
  try {
    const response = await apiClient.get('/v1/purchase/list');
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении списка покупок:', error);
    throw error;
  }
};

/**
 * Создаёт новую покупку
 *
 * API endpoint: POST /v1/purchase/save
 *
 * @param {Object} purchaseData - Данные для создания покупки
 * @param {string} purchaseData.name - Название покупки (обязательно, макс. 200 символов)
 * @param {string} purchaseData.priority - Приоритет (HIGH, MIDDLE, LOW) - обязательно
 * @param {string} purchaseData.categoryName - Название категории (обязательно, макс. 100 символов)
 * @param {boolean} purchaseData.isComplete - Статус завершенности (обязательно)
 * @param {Array} purchaseData.linkList - Список ссылок (опционально)
 * @param {Array} purchaseData.priceList - Список цен (опционально)
 * @returns {Promise} Промис с данными от сервера
 */
export const createPurchase = async (purchaseData) => {
  try {
    const requestBody = {
      name: purchaseData.name,
      priority: purchaseData.priority,
      categoryName: purchaseData.categoryName,
      isComplete: purchaseData.isComplete,
      linkList: purchaseData.linkList || [],
      priceList: purchaseData.priceList || []
    };

    const response = await apiClient.post('/v1/purchase/save', requestBody);
    return response.data;
  } catch (error) {
    console.error('Ошибка при создании покупки:', error);
    throw error;
  }
};

/**
 * Обновляет покупку
 *
 * API endpoint: POST /v1/purchase/update
 *
 * @param {Object} purchaseData - Данные для обновления покупки
 * @param {number} purchaseData.id - ID покупки (обязательно)
 * @param {string} purchaseData.name - Название покупки (обязательно, макс. 200 символов)
 * @param {string} purchaseData.priority - Приоритет (HIGH, MIDDLE, LOW) - обязательно
 * @param {string} purchaseData.categoryName - Название категории (обязательно, макс. 100 символов)
 * @param {boolean} purchaseData.isComplete - Статус завершенности (обязательно)
 * @param {string} purchaseData.status - Статус (IN_PROGRESS, DONE, PAUSED) - обязательно
 * @param {Array} purchaseData.linkList - Список ссылок (опционально)
 * @param {Array} purchaseData.priceList - Список цен (опционально)
 * @returns {Promise} Промис с данными от сервера
 */
export const updatePurchase = async (purchaseData) => {
  try {
    const requestBody = {
      id: purchaseData.id,
      name: purchaseData.name,
      priority: purchaseData.priority,
      categoryName: purchaseData.categoryName,
      isComplete: purchaseData.isComplete,
      status: purchaseData.status,
      linkList: purchaseData.linkList || [],
      priceList: purchaseData.priceList || []
    };

    const response = await apiClient.post('/v1/purchase/update', requestBody);
    return response.data;
  } catch (error) {
    console.error('Ошибка при обновлении покупки:', error);
    throw error;
  }
};

/**
 * Удаляет покупку
 *
 * API endpoint: DELETE /v1/purchase
 *
 * @param {number} id - ID покупки для удаления
 * @returns {Promise} Промис с данными от сервера
 */
export const deletePurchase = async (id) => {
  try {
    const response = await apiClient.delete(`/v1/purchase/${id}`);
    return response.data;
  } catch (error) {
    console.error('Ошибка при удалении покупки:', error);
    throw error;
  }
};

/**
 * Получает список всех категорий покупок
 *
 * API endpoint: GET /v1/purchase/category/list
 *
 * @returns {Promise} Промис с данными от сервера
 */
export const getPurchaseCategories = async () => {
  try {
    const response = await apiClient.get('/v1/purchase/category/list');
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении списка категорий:', error);
    throw error;
  }
};

// Экспортируем объект apiClient на случай, если нужно будет делать другие запросы
export default apiClient;
