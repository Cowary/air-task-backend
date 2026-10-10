import apiClient from './client';

/**
 * Получает список MCP API-ключей.
 *
 * API endpoint: GET /mcp/v1/key/list
 *
 * @returns {Promise} Промис с обёрткой { isSuccess, data, errorMessage }
 */
export const listMcpKeys = async () => {
  try {
    const response = await apiClient.get('/mcp/v1/key/list');
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении MCP-ключей:', error);
    throw error;
  }
};

/**
 * Создаёт новый MCP API-ключ. Открытый ключ возвращается только один раз.
 *
 * API endpoint: POST /mcp/v1/key
 *
 * @param {Object} payload
 * @param {string} payload.name - Человекочитаемое имя ключа
 * @returns {Promise} Промис с обёрткой { isSuccess, data, errorMessage }
 */
export const createMcpKey = async (payload) => {
  try {
    const response = await apiClient.post('/mcp/v1/key', payload);
    return response.data;
  } catch (error) {
    console.error('Ошибка при создании MCP-ключа:', error);
    throw error;
  }
};

/**
 * Переименовывает MCP API-ключ.
 *
 * API endpoint: PUT /mcp/v1/key/{id}
 *
 * @param {number|string} id - Идентификатор ключа
 * @param {Object} payload
 * @param {string} payload.name - Новое имя ключа
 * @returns {Promise} Промис с обёрткой { isSuccess, data, errorMessage }
 */
export const renameMcpKey = async (id, payload) => {
  try {
    const response = await apiClient.put(`/mcp/v1/key/${id}`, payload);
    return response.data;
  } catch (error) {
    console.error('Ошибка при переименовании MCP-ключа:', error);
    throw error;
  }
};

/**
 * Отзывает MCP API-ключ. Агенты с этим ключом немедленно теряют доступ.
 *
 * API endpoint: POST /mcp/v1/key/{id}/revoke
 *
 * @param {number|string} id - Идентификатор ключа
 * @returns {Promise} Промис с обёрткой { isSuccess, data, errorMessage }
 */
export const revokeMcpKey = async (id) => {
  try {
    const response = await apiClient.post(`/mcp/v1/key/${id}/revoke`);
    return response.data;
  } catch (error) {
    console.error('Ошибка при отзыве MCP-ключа:', error);
    throw error;
  }
};

/**
 * Получает журнал действий агентов через MCP.
 *
 * API endpoint: GET /mcp/v1/audit/list
 *
 * @param {Object} [params]
 * @param {number|string} [params.apiKeyId] - Фильтр по ключу
 * @param {string} [params.toolName] - Фильтр по имени инструмента
 * @param {number} [params.limit] - Размер страницы
 * @param {number} [params.offset] - Смещение
 * @returns {Promise} Промис с обёрткой { isSuccess, data, errorMessage }
 */
export const listMcpAudit = async (params = {}) => {
  try {
    const response = await apiClient.get('/mcp/v1/audit/list', { params });
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении журнала действий агентов:', error);
    throw error;
  }
};
