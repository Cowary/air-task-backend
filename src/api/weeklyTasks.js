import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Возвращает текущее время в формате ISO с таймзоной Москвы
 */
const getMoscowTimeISO = () => {
  return new Date().toLocaleString('sv-SE', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).replace(' ', 'T') + '+03:00';
};

/**
 * Получает статистику выполнения задач за текущую неделю
 * 
 * API endpoint: GET /api/completed-weekly/v1/statistics/current-week
 * 
 * Возвращает объект с двумя массивами:
 * - completedTasks: выполненные задачи на этой неделе
 * - incompleteTasks: невыполненные задачи на этой неделе
 * 
 * @returns {Promise} Промис с данными от сервера
 */
export const getWeeklyTaskStatistics = async () => {
  try {
    const response = await apiClient.get('/completed-weekly/v1/statistics/current-week');
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении статистики:', error);
    throw error;
  }
};

/**
 * Отмечает задачу как выполненную
 * 
 * API endpoint: POST /api/completed-weekly/v1
 * 
 * @param {number} weeklyEntityId - ID задачи (weekly entity), которую нужно отметить выполненной
 * @returns {Promise} Промис с данными от сервера
 */
export const completeWeeklyTask = async (weeklyEntityId) => {
  try {
    const requestBody = {
      weeklyEntityId: weeklyEntityId,
      completedDate: getMoscowTimeISO()
    };
    
    const response = await apiClient.post('/completed-weekly/v1', requestBody);
    return response.data;
  } catch (error) {
    console.error('Ошибка при отметке задачи:', error);
    throw error;
  }
};

/**
 * Получает список всех недельных задач
 * 
 * API endpoint: GET /api/weekly/v1/list
 * 
 * @returns {Promise} Промис с данными от сервера
 */
export const getAllWeeklyTasks = async () => {
  try {
    const response = await apiClient.get('/weekly/v1/list');
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении списка задач:', error);
    throw error;
  }
};

/**
 * Получает список всех проектов
 * 
 * API endpoint: GET /api/project/v1/list
 * 
 * @returns {Promise} Промис с данными от сервера
 */
export const getAllProjects = async () => {
  try {
    const response = await apiClient.get('/project/v1/list');
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

    const response = await apiClient.post('/project/v1', requestBody);
    return response.data;
  } catch (error) {
    console.error('Ошибка при создании проекта:', error);
    throw error;
  }
};

/**
 * Создаёт новую недельную задачу
 *
 * API endpoint: POST /api/weekly/v1
 *
 * @param {Object} taskData - Данные для создания задачи
 * @param {string} taskData.name - Название задачи
 * @param {number} taskData.count - Требуемое количество выполнений
 * @param {string} taskData.projectName - Название проекта (обязательно для backend)
 * @param {string} taskData.priority - Приоритет (HIGH, MIDDLE, LOW)
 * @param {string} taskData.status - Статус (IN_PROGRESS, DONE)
 * @returns {Promise} Промис с данными от сервера
 */
export const createWeeklyTask = async (taskData) => {
  try {
    const requestBody = {
      name: taskData.name,
      count: taskData.count,
      projectName: taskData.projectName,
      priority: taskData.priority || 'MIDDLE',
      status: taskData.status || 'IN_PROGRESS'
    };

    const response = await apiClient.post('/weekly/v1', requestBody);
    return response.data;
  } catch (error) {
    console.error('Ошибка при создании задачи:', error);
    throw error;
  }
};

/**
 * Обновляет недельную задачу
 * 
 * API endpoint: PUT /api/weekly/v1/{id}
 * 
 * @param {number} id - ID задачи
 * @param {Object} taskData - Данные для обновления
 * @param {string} taskData.name - Название задачи
 * @param {number} taskData.count - Требуемое количество выполнений
 * @param {string} taskData.projectName - Название проекта (обязательно для backend)
 * @param {string} taskData.priority - Приоритет (HIGH, MIDDLE, LOW)
 * @param {string} taskData.status - Статус (IN_PROGRESS, DONE)
 * @returns {Promise} Промис с данными от сервера
 */
export const updateWeeklyTask = async (id, taskData) => {
  try {
    const requestBody = {
      id: id,
      name: taskData.name,
      count: taskData.count,
      projectName: taskData.projectName,
      priority: taskData.priority,
      status: taskData.status
    };
    
    const response = await apiClient.put(`/weekly/v1/${id}`, requestBody);
    return response.data;
  } catch (error) {
    console.error('Ошибка при обновлении задачи:', error);
    throw error;
  }
};

/**
 * Удаляет недельную задачу
 * 
 * API endpoint: DELETE /api/weekly/v1/{id}
 * 
 * @param {number} id - ID задачи для удаления
 * @returns {Promise} Промис с данными от сервера
 */
export const deleteWeeklyTask = async (id) => {
  try {
    const response = await apiClient.delete(`/weekly/v1/${id}`);
    return response.data;
  } catch (error) {
    console.error('Ошибка при удалении задачи:', error);
    throw error;
  }
};

/**
 * Получает информацию о состоянии здоровья backend
 * 
 * API endpoint: GET /health
 * 
 * Возвращает объект с полями:
 * - version: версия backend
 * - isHealthy: статус здоровья сервиса
 * 
 * @returns {Promise} Промис с данными от сервера
 */
export const getHealth = async () => {
  try {
    const response = await apiClient.get('/health');
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении health:', error);
    throw error;
  }
};

// Экспортируем объект apiClient на случай, если нужно будет делать другие запросы
export default apiClient;