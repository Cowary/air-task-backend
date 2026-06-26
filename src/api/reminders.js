import apiClient from './client';

export const getRemindersCountdown = async () => {
  try {
    const response = await apiClient.get('/v1/reminder/list-count');
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении списка напоминаний (countdown):', error);
    throw error;
  }
};

export const getReminders = async () => {
  try {
    const response = await apiClient.get('/v1/reminder/list');
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении списка напоминаний:', error);
    throw error;
  }
};

export const createReminder = async (reminderData) => {
  try {
    const requestBody = {
      name: reminderData.name,
      status: reminderData.status,
      priority: reminderData.priority,
      reminderDateTime: reminderData.reminderDateTime,
      type: reminderData.type
    };

    const response = await apiClient.post('/v1/reminder/save', requestBody);
    return response.data;
  } catch (error) {
    console.error('Ошибка при создании напоминания:', error);
    throw error;
  }
};

export const updateReminder = async (reminderData) => {
  try {
    const requestBody = {
      id: reminderData.id,
      name: reminderData.name,
      status: reminderData.status,
      priority: reminderData.priority,
      reminderDateTime: reminderData.reminderDateTime,
      type: reminderData.type
    };

    const response = await apiClient.post('/v1/reminder/update', requestBody);
    return response.data;
  } catch (error) {
    console.error('Ошибка при обновлении напоминания:', error);
    throw error;
  }
};

export const deleteReminder = async (id) => {
  try {
    const response = await apiClient.delete(`/v1/reminder/${id}`);
    return response.data;
  } catch (error) {
    console.error('Ошибка при удалении напоминания:', error);
    throw error;
  }
};

export const refreshReminder = async (id) => {
  try {
    const response = await apiClient.post('/v1/reminder/refresh', { id });
    return response.data;
  } catch (error) {
    console.error('Ошибка при обновлении напоминания:', error);
    throw error;
  }
};
