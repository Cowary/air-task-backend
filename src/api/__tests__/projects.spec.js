import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}));

import apiClient from '../client.js';
import {
  getAllProjects,
  ACTIVE_PROJECT_STATUSES,
  ALL_PROJECT_STATUSES
} from '../projects.js';
import { getAllProjects as getAllProjectsFromTasksApi } from '../tasks.js';
import { getAllProjects as getAllProjectsFromWeeklyApi } from '../weeklyTasks.js';

describe('api/projects.js — getAllProjects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiClient.get.mockResolvedValue({ data: { isSuccess: true, data: { projects: [] } } });
  });

  it('отправляет запрос без параметров по умолчанию (сервер вернёт только активные)', async () => {
    await getAllProjects();

    expect(apiClient.get).toHaveBeenCalledWith('/project/v1/list', { params: {} });
  });

  it('кодирует statuses через запятую и добавляет sortByPriority', async () => {
    await getAllProjects({ statuses: ['ACTIVE', 'IN_PROGRESS'], sortByPriority: true });

    expect(apiClient.get).toHaveBeenCalledWith('/project/v1/list', {
      params: { statuses: 'ACTIVE,IN_PROGRESS', sortByPriority: true }
    });
  });

  it('не добавляет sortByPriority, когда сортировка не запрошена', async () => {
    await getAllProjects({ statuses: ALL_PROJECT_STATUSES });

    expect(apiClient.get).toHaveBeenCalledWith('/project/v1/list', {
      params: { statuses: 'ACTIVE,IN_PROGRESS,DONE,ARCHIVED' }
    });
  });

  it('игнорирует пустой массив statuses', async () => {
    await getAllProjects({ statuses: [], sortByPriority: false });

    expect(apiClient.get).toHaveBeenCalledWith('/project/v1/list', { params: {} });
  });

  it('возвращает data ответа бэкенда без изменений', async () => {
    const payload = { isSuccess: true, data: { projects: [{ id: 1 }] } };
    apiClient.get.mockResolvedValue({ data: payload });

    await expect(getAllProjects({ statuses: ACTIVE_PROJECT_STATUSES })).resolves.toBe(payload);
  });

  it('ACTIVE_PROJECT_STATUSES включает ACTIVE и IN_PROGRESS, ALL — все четыре статуса', () => {
    expect(ACTIVE_PROJECT_STATUSES).toEqual(['ACTIVE', 'IN_PROGRESS']);
    expect(ALL_PROJECT_STATUSES).toEqual(['ACTIVE', 'IN_PROGRESS', 'DONE', 'ARCHIVED']);
  });

  it('tasks.js и weeklyTasks.js реэкспортируют ту же getAllProjects', async () => {
    expect(getAllProjectsFromTasksApi).toBe(getAllProjects);
    expect(getAllProjectsFromWeeklyApi).toBe(getAllProjects);
  });
});
