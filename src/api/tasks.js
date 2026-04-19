// Импортируем axios для выполнения HTTP-запросов к серверу
import axios from 'axios';

// Получаем адрес backend из переменной окружения
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://192.168.1.79:8102';

// Создаём экземпляр axios с базовой конфигурацией
const apiClient = axios.create({
  baseURL: backendUrl,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Получает список всех проектов
 *
 * API endpoint: GET /api/project/v1/list
 *
 * @returns {Promise} Промис с данными от сервера
 */
export const getAllProjects = async () => {
  try {
    const response = await apiClient.get('/api/project/v1/list');
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении списка проектов:', error);
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

    const response = await apiClient.post('/api/project/v1', requestBody);
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
 * @returns {Promise} Промис с данными от сервера
 */
export const getTasks = async () => {
  try {
    const response = await apiClient.get('/v1/task/list');
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
 * @param {string} taskData.status - Статус (IN_PROGRESS, DONE, PAUSED) - обязательно
 * @param {string} [taskData.description] - Описание задачи (опционально, макс. 10000 символов)
 * @returns {Promise} Промис с данными от сервера
 */
export const createTask = async (taskData) => {
  try {
    const requestBody = {
      name: taskData.name,
      priority: taskData.priority,
      projectName: taskData.projectName,
      status: taskData.status,
      description: taskData.description
    };

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
 * @param {string} taskData.status - Статус (IN_PROGRESS, DONE, PAUSED) - обязательно
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
      status: taskData.status,
      description: taskData.description
    };

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
 * API endpoint: DELETE /v1/task
 *
 * @param {number} id - ID задачи для удаления
 * @returns {Promise} Промис с данными от сервера
 */
export const deleteTask = async (id) => {
  try {
    const requestBody = {
      id: id
    };

    const response = await apiClient.delete('/v1/task', {
      data: requestBody
    });
    return response.data;
  } catch (error) {
    console.error('Ошибка при удалении задачи:', error);
    throw error;
  }
};

// Экспортируем объект apiClient на случай, если нужно будет делать другие запросы
export default apiClient;
