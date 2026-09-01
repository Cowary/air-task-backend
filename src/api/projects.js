import apiClient from './client';

// Статусы, которые бэкенд считает «активными» (возвращаются по умолчанию)
export const ACTIVE_PROJECT_STATUSES = ['ACTIVE', 'IN_PROGRESS'];
export const ALL_PROJECT_STATUSES = ['ACTIVE', 'IN_PROGRESS', 'DONE', 'ARCHIVED'];

/**
 * Получает список проектов
 *
 * API endpoint: GET /api/project/v1/list
 *
 * Бэкенд по умолчанию возвращает только активные проекты (ACTIVE, IN_PROGRESS).
 *
 * @param {Object} [options] - Параметры запроса
 * @param {string[]} [options.statuses] - Статусы проектов для включения в ответ (по умолчанию — активные)
 * @param {boolean} [options.sortByPriority] - Сортировать по приоритету: HIGH → MIDDLE → LOW, затем по имени
 * @returns {Promise} Промис с данными от сервера
 */
export const getAllProjects = async ({ statuses = null, sortByPriority = false } = {}) => {
  try {
    const params = {};

    if (statuses && statuses.length > 0) {
      params.statuses = statuses.join(',');
    }
    if (sortByPriority) {
      params.sortByPriority = true;
    }

    const response = await apiClient.get('/project/v1/list', { params });
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении списка проектов:', error);
    throw error;
  }
};

/**
 * Получает проект по ID
 *
 * API endpoint: GET /api/project/v1/{id}
 *
 * @param {number} id - ID проекта
 * @returns {Promise} Промис с данными от сервера
 */
export const getProjectById = async (id) => {
  try {
    const response = await apiClient.get(`/project/v1/${id}`);
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении проекта:', error);
    throw error;
  }
};

/**
 * Создаёт новый проект
 *
 * API endpoint: POST /api/project/v1
 *
 * @param {Object} projectData - Данные для создания проекта
 * @param {string} projectData.name - Название проекта (обязательно)
 * @param {string} [projectData.status] - Статус проекта
 * @param {string} [projectData.priority] - Приоритет проекта
 * @param {number[]} [projectData.weeklyIds] - ID привязанных еженедельных задач
 * @param {number[]} [projectData.taskIds] - ID привязанных задач
 * @returns {Promise} Промис с данными от сервера
 */
export const createProject = async (projectData) => {
  try {
    const requestBody = {
      name: projectData.name,
      status: projectData.status,
      priority: projectData.priority
    };

    const response = await apiClient.post('/project/v1', requestBody);
    return response.data;
  } catch (error) {
    console.error('Ошибка при создании проекта:', error);
    throw error;
  }
};

/**
 * Обновляет проект (включая привязку/отвязку задач)
 *
 * API endpoint: PUT /api/project/v1/{id}
 *
 * @param {number} id - ID проекта
 * @param {Object} projectData - Данные для обновления
 * @param {string} projectData.name - Название проекта
 * @param {string} projectData.status - Статус проекта
 * @param {string} projectData.priority - Приоритет проекта
 * @param {number[]} projectData.weeklyIds - Полный список ID еженедельных задач
 * @param {number[]} projectData.taskIds - Полный список ID задач
 * @returns {Promise} Промис с данными от сервера
 */
export const updateProject = async (id, projectData) => {
  try {
    const requestBody = {
      name: projectData.name,
      status: projectData.status,
      priority: projectData.priority,
      weeklyIds: projectData.weeklyIds || [],
      taskIds: projectData.taskIds || []
    };

    const response = await apiClient.put(`/project/v1/${id}`, requestBody);
    return response.data;
  } catch (error) {
    console.error('Ошибка при обновлении проекта:', error);
    throw error;
  }
};

/**
 * Удаляет проект
 *
 * API endpoint: DELETE /api/project/v1/{id}
 *
 * @param {number} id - ID проекта для удаления
 * @returns {Promise} Промис с данными от сервера
 */
export const deleteProject = async (id) => {
  try {
    const response = await apiClient.delete(`/project/v1/${id}`);
    return response.data;
  } catch (error) {
    console.error('Ошибка при удалении проекта:', error);
    throw error;
  }
};
