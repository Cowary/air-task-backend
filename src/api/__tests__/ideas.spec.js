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
import { getAllIdeas, createIdea, updateIdea, deleteIdea } from '../ideas.js';

describe('api/ideas.js', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiClient.get.mockResolvedValue({ data: { isSuccess: true, data: [] } });
    apiClient.post.mockResolvedValue({ data: { isSuccess: true, data: {} } });
    apiClient.put.mockResolvedValue({ data: { isSuccess: true, data: {} } });
    apiClient.delete.mockResolvedValue({ data: { isSuccess: true } });
  });

  it('getAllIdeas запрашивает список идей', async () => {
    const response = await getAllIdeas();

    expect(apiClient.get).toHaveBeenCalledWith('/idea/v1/list');
    expect(response).toEqual({ isSuccess: true, data: [] });
  });

  it('createIdea отправляет название и описание', async () => {
    await createIdea({ name: 'Идея', description: 'Описание' });

    expect(apiClient.post).toHaveBeenCalledWith('/idea/v1', {
      name: 'Идея',
      description: 'Описание'
    });
  });

  it('createIdea нормализует пустое описание в null', async () => {
    await createIdea({ name: 'Идея', description: '' });

    expect(apiClient.post).toHaveBeenCalledWith('/idea/v1', {
      name: 'Идея',
      description: null
    });
  });

  it('updateIdea обновляет идею по id', async () => {
    await updateIdea(5, { name: 'Идея 2', description: 'Текст' });

    expect(apiClient.put).toHaveBeenCalledWith('/idea/v1/5', {
      name: 'Идея 2',
      description: 'Текст'
    });
  });

  it('deleteIdea удаляет идею по id', async () => {
    await deleteIdea(3);

    expect(apiClient.delete).toHaveBeenCalledWith('/idea/v1/3');
  });

  it('пробрасывает ошибку сети', async () => {
    apiClient.get.mockRejectedValueOnce(new Error('network'));

    await expect(getAllIdeas()).rejects.toThrow('network');
  });
});
