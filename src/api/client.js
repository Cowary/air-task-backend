import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

const publicPaths = ['/auth/login', '/health'];

apiClient.interceptors.request.use((config) => {
  const isPublic = publicPaths.some(path => config.url.includes(path));
  if (!isPublic) {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('auth_disabled');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
