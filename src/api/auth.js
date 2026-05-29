import apiClient from './client';

export const login = async (login, password) => {
  try {
    const response = await apiClient.post('/auth/login', { login, password });
    return response.data;
  } catch (error) {
    console.error('Ошибка при входе:', error);
    throw error;
  }
};
