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
  getWallet,
  getTransactions,
  getGamificationSettings,
  updateGamificationSettings
} from '../gamification.js';

describe('api/gamification.js', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiClient.get.mockResolvedValue({ data: { isSuccess: true, data: {} } });
    apiClient.put.mockResolvedValue({ data: { isSuccess: true, data: {} } });
  });

  it('getWallet запрашивает кошелёк монет', async () => {
    const response = await getWallet();

    expect(apiClient.get).toHaveBeenCalledWith('/gamification/v1/wallet');
    expect(response).toEqual({ isSuccess: true, data: {} });
  });

  it('getTransactions запрашивает историю операций', async () => {
    await getTransactions();

    expect(apiClient.get).toHaveBeenCalledWith('/gamification/v1/transactions');
  });

  it('getGamificationSettings запрашивает тарифы', async () => {
    await getGamificationSettings();

    expect(apiClient.get).toHaveBeenCalledWith('/gamification/v1/settings');
  });

  it('updateGamificationSettings отправляет тарифы через PUT', async () => {
    const settings = { taskRewardHigh: 10, projectBonusPercent: 100 };

    await updateGamificationSettings(settings);

    expect(apiClient.put).toHaveBeenCalledWith('/gamification/v1/settings', settings);
  });
});
