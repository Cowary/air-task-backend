import apiClient from './client';

/**
 * Получает список проектов — реализация в './projects.js'
 *
 * @see module:./projects
 */
export { getAllProjects } from './projects.js';

/**
 * Создаёт новый проект
 *
 * API endpoint: POST /api/project/v1
 *
 * @param {Object} projectData - Данные для создания проекта
 * @param {string} projectData.name - Название проекта (обязательно)
 * @param {string} [projectData.status] - Статус проекта (опционально)
 * @param {string} [projectData.priority] - Приоритет проекта (опционально)
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
 * Получает список всех задач
 *
 * API endpoint: GET /v1/task/list
 *
 * @param {boolean} [isComplete] - Опциональный флаг выполнения для фильтрации (true — выполненные, false — невыполненные)
 * @returns {Promise} Промис с данными от сервера
 */
export const getTasks = async (isComplete = null) => {
  try {
    const config = isComplete === null || isComplete === undefined
      ? {}
      : { params: { isComplete } };
    const response = await apiClient.get('/v1/task/list', config);
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении списка задач:', error);
    throw error;
  }
};

/**
 * Создаёт новую задачу
 *
 * API endpoint: POST /v1/task/save
 *
 * @param {Object} taskData - Данные для создания задачи
 * @param {string} taskData.name - Название задачи (обязательно, макс. 200 символов)
 * @param {string} taskData.priority - Приоритет (HIGH, MIDDLE, LOW) - обязательно
 * @param {string} taskData.projectName - Название проекта (обязательно, макс. 100 символов)
 * @param {boolean} [taskData.isComplete] - Флаг выполнения (опционально, по умолчанию false)
 * @param {string} [taskData.description] - Описание задачи (опционально, макс. 10000 символов)
 * @returns {Promise} Промис с данными от сервера
 */
export const createTask = async (taskData) => {
  try {
    const requestBody = {
      name: taskData.name,
      priority: taskData.priority,
      projectName: taskData.projectName,
      isComplete: taskData.isComplete,
      description: taskData.description
    };

    if (Array.isArray(taskData.subTasks)) {
      requestBody.subTasks = taskData.subTasks;
    }

    const response = await apiClient.post('/v1/task/save', requestBody);
    return response.data;
  } catch (error) {
    console.error('Ошибка при создании задачи:', error);
    throw error;
  }
};

/**
 * Обновляет задачу
 *
 * API endpoint: POST /v1/task/update
 *
 * @param {Object} taskData - Данные для обновления задачи
 * @param {number} taskData.id - ID задачи (обязательно)
 * @param {string} taskData.name - Название задачи (обязательно, макс. 200 символов)
 * @param {string} taskData.priority - Приоритет (HIGH, MIDDLE, LOW) - обязательно
 * @param {string} taskData.projectName - Название проекта (обязательно, макс. 100 символов)
 * @param {boolean} [taskData.isComplete] - Флаг выполнения (опционально)
 * @param {string} [taskData.description] - Описание задачи (опционально, макс. 1000 символов)
 * @returns {Promise} Промис с данными от сервера
 */
export const updateTask = async (taskData) => {
  try {
    const requestBody = {
      id: taskData.id,
      name: taskData.name,
      priority: taskData.priority,
      projectName: taskData.projectName,
      isComplete: taskData.isComplete,
      description: taskData.description
    };

    if (Array.isArray(taskData.subTasks)) {
      requestBody.subTasks = taskData.subTasks;
    }

    const response = await apiClient.post('/v1/task/update', requestBody);
    return response.data;
  } catch (error) {
    console.error('Ошибка при обновлении задачи:', error);
    throw error;
  }
};

/**
 * Удаляет задачу
 *
 * API endpoint: DELETE /v1/task/{id}
 *
 * @param {number} id - ID задачи для удаления
 * @returns {Promise} Промис с данными от сервера
 */
export const deleteTask = async (id) => {
  try {
    const response = await apiClient.delete(`/v1/task/${id}`);
    return response.data;
  } catch (error) {
    console.error('Ошибка при удалении задачи:', error);
    throw error;
  }
};

/**
 * Инвертирует флаг выполнения шага задачи
 *
 * API endpoint: POST /v1/task/{id}/subtask/{subTaskId}/toggle
 *
 * @param {number} taskId - ID задачи
 * @param {number} subTaskId - ID шага
 * @returns {Promise} Промис с обновлённой задачей (ApiRs<TaskResponse>)
 */
export const toggleSubTask = async (taskId, subTaskId) => {
  try {
    const response = await apiClient.post(`/v1/task/${taskId}/subtask/${subTaskId}/toggle`);
    return response.data;
  } catch (error) {
    console.error('Ошибка при переключении шага задачи:', error);
    throw error;
  }
};

/**
 * Инвертирует флаг выполнения задачи
 *
 * API endpoint: POST /v1/task/{id}/toggle
 *
 * @param {number} id - ID задачи
 * @returns {Promise} Промис с обновлённой задачей (ApiRs<TaskResponse>)
 */
export const toggleTask = async (id) => {
  try {
    const response = await apiClient.post(`/v1/task/${id}/toggle`);
    return response.data;
  } catch (error) {
    console.error('Ошибка при переключении статуса задачи:', error);
    throw error;
  }
};

