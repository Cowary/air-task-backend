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
import { getRewards, createReward, updateReward, deleteReward, buyReward } from '../rewards.js';

describe('api/rewards.js', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiClient.get.mockResolvedValue({ data: { isSuccess: true, data: [] } });
    apiClient.post.mockResolvedValue({ data: { isSuccess: true, data: {} } });
    apiClient.put.mockResolvedValue({ data: { isSuccess: true, data: {} } });
    apiClient.delete.mockResolvedValue({ data: { isSuccess: true } });
  });

  it('getRewards запрашивает список наград', async () => {
    const response = await getRewards();

    expect(apiClient.get).toHaveBeenCalledWith('/reward/v1/list');
    expect(response).toEqual({ isSuccess: true, data: [] });
  });

  it('createReward отправляет название, описание, цену и приоритет', async () => {
    await createReward({ name: 'Шоколадка', description: 'На выбор', cost: 15, priority: 'MIDDLE' });

    expect(apiClient.post).toHaveBeenCalledWith('/reward/v1', {
      name: 'Шоколадка',
      description: 'На выбор',
      cost: 15,
      priority: 'MIDDLE'
    });
  });

  it('createReward нормализует пустое описание в null', async () => {
    await createReward({ name: 'Шоколадка', description: '', cost: 15, priority: 'MIDDLE' });

    expect(apiClient.post).toHaveBeenCalledWith('/reward/v1', {
      name: 'Шоколадка',
      description: null,
      cost: 15,
      priority: 'MIDDLE'
    });
  });

  it('updateReward обновляет награду по id', async () => {
    await updateReward(5, { name: 'Кофе', description: null, cost: 25, priority: 'HIGH' });

    expect(apiClient.put).toHaveBeenCalledWith('/reward/v1/5', {
      name: 'Кофе',
      description: null,
      cost: 25,
      priority: 'HIGH'
    });
  });

  it('deleteReward удаляет награду по id', async () => {
    await deleteReward(3);

    expect(apiClient.delete).toHaveBeenCalledWith('/reward/v1/3');
  });

  it('buyReward покупает награду по id', async () => {
    await buyReward(7);

    expect(apiClient.post).toHaveBeenCalledWith('/reward/v1/7/buy');
  });
});
