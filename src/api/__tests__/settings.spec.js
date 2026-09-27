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
import { getAppSettings, updateAppSettings } from '../settings.js';

describe('api/settings.js', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiClient.get.mockResolvedValue({ data: { isSuccess: true, data: {} } });
    apiClient.put.mockResolvedValue({ data: { isSuccess: true, data: {} } });
  });

  it('getAppSettings запрашивает настройки приложения', async () => {
    const response = await getAppSettings();

    expect(apiClient.get).toHaveBeenCalledWith('/settings/v1');
    expect(response).toEqual({ isSuccess: true, data: {} });
  });

  it('updateAppSettings отправляет настройки через PUT', async () => {
    const settings = { firstDayOfWeek: 'MONDAY' };

    await updateAppSettings(settings);

    expect(apiClient.put).toHaveBeenCalledWith('/settings/v1', settings);
  });
});
