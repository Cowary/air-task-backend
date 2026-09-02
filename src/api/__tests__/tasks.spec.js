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
import { getTasks, createTask, updateTask, toggleTask, deleteTask } from '../tasks.js';

describe('api/tasks.js — работа с is_complete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiClient.get.mockResolvedValue({ data: { isSuccess: true, data: [] } });
    apiClient.post.mockResolvedValue({ data: { isSuccess: true, data: {} } });
    apiClient.delete.mockResolvedValue({ data: { isSuccess: true } });
  });

  describe('getTasks', () => {
    it('без параметров запрашивает все задачи', async () => {
      await getTasks();

      expect(apiClient.get).toHaveBeenCalledWith('/v1/task/list', {});
    });

    it('false фильтрует по невыполненным', async () => {
      await getTasks(false);

      expect(apiClient.get).toHaveBeenCalledWith('/v1/task/list', { params: { isComplete: false } });
    });

    it('true фильтрует по выполненным', async () => {
      await getTasks(true);

      expect(apiClient.get).toHaveBeenCalledWith('/v1/task/list', { params: { isComplete: true } });
    });

    it('null и undefined не добавляют параметр isComplete', async () => {
      await getTasks(null);
      await getTasks(undefined);

      expect(apiClient.get).toHaveBeenLastCalledWith('/v1/task/list', {});
    });
  });

  describe('createTask', () => {
    it('не отправляет поле status в теле запроса', async () => {
      await createTask({
        name: 'Задача',
        priority: 'LOW',
        projectName: 'Проект',
        status: 'BACKLOG'
      });

      const body = apiClient.post.mock.calls[0][1];
      expect(body).not.toHaveProperty('status');
      expect(body).toMatchObject({ name: 'Задача', priority: 'LOW', projectName: 'Проект' });
    });

    it('отправляет isComplete, когда он передан', async () => {
      await createTask({ name: 'Задача', priority: 'LOW', projectName: 'П', isComplete: true });

      expect(apiClient.post).toHaveBeenCalledWith(
        '/v1/task/save',
        expect.objectContaining({ isComplete: true })
      );
    });
  });

  describe('updateTask', () => {
    it('не отправляет поле status в теле запроса', async () => {
      await updateTask({ id: 7, name: 'Задача', priority: 'LOW', projectName: 'П', status: 'DONE' });

      const body = apiClient.post.mock.calls[0][1];
      expect(body).not.toHaveProperty('status');
    });

    it('отправляет isComplete в теле запроса', async () => {
      await updateTask({ id: 7, name: 'Задача', priority: 'LOW', projectName: 'П', isComplete: false });

      expect(apiClient.post).toHaveBeenCalledWith(
        '/v1/task/update',
        expect.objectContaining({ id: 7, isComplete: false })
      );
    });

    it('сохраняет subTasks в теле запроса', async () => {
      const subTasks = [{ id: 1, name: 'Шаг', position: 1, isCompleted: false }];
      await updateTask({ id: 7, name: 'Задача', priority: 'LOW', projectName: 'П', subTasks });

      expect(apiClient.post).toHaveBeenCalledWith(
        '/v1/task/update',
        expect.objectContaining({ subTasks })
      );
    });
  });

  describe('toggleTask', () => {
    it('дёргает POST /v1/task/{id}/toggle без тела', async () => {
      const response = await toggleTask(42);

      expect(apiClient.post).toHaveBeenCalledWith('/v1/task/42/toggle');
      expect(response).toEqual({ isSuccess: true, data: {} });
    });

    it('пробрасывает ошибку сети', async () => {
      apiClient.post.mockRejectedValueOnce(new Error('network'));

      await expect(toggleTask(1)).rejects.toThrow('network');
    });
  });

  it('deleteTask удаляет задачу по id', async () => {
    await deleteTask(3);

    expect(apiClient.delete).toHaveBeenCalledWith('/v1/task/3');
  });
});
