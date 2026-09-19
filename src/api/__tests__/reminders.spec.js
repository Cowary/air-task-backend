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
  getAllReminders,
  getReminder,
  createReminder,
  updateReminder,
  deleteReminder,
  completeReminder,
  skipReminder,
  getReminderHistory
} from '../reminders.js';

describe('api/reminders.js', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiClient.get.mockResolvedValue({ data: { isSuccess: true, data: [] } });
    apiClient.post.mockResolvedValue({ data: { isSuccess: true, data: {} } });
    apiClient.put.mockResolvedValue({ data: { isSuccess: true, data: {} } });
    apiClient.delete.mockResolvedValue({ data: { isSuccess: true } });
  });

  it('getAllReminders по умолчанию не запрашивает удалённые', async () => {
    await getAllReminders();

    expect(apiClient.get).toHaveBeenCalledWith('/reminder/v1/list', { params: {} });
  });

  it('getAllReminders с includeDeleted передаёт параметр', async () => {
    await getAllReminders({ includeDeleted: true });

    expect(apiClient.get).toHaveBeenCalledWith('/reminder/v1/list', { params: { includeDeleted: true } });
  });

  it('getReminder запрашивает по id', async () => {
    await getReminder(5);

    expect(apiClient.get).toHaveBeenCalledWith('/reminder/v1/5');
  });

  it('createReminder отправляет поля повторения', async () => {
    await createReminder({
      name: 'Масло',
      description: 'Раз в 3 месяца',
      recurrenceType: 'INTERVAL',
      intervalValue: 3,
      intervalUnit: 'MONTHS',
      startDate: '2026-01-15'
    });

    expect(apiClient.post).toHaveBeenCalledWith('/reminder/v1', {
      name: 'Масло',
      description: 'Раз в 3 месяца',
      recurrenceType: 'INTERVAL',
      intervalValue: 3,
      intervalUnit: 'MONTHS',
      startDate: '2026-01-15'
    });
  });

  it('updateReminder обновляет по id', async () => {
    await updateReminder(5, {
      name: 'Масло',
      recurrenceType: 'ONCE',
      startDate: '2026-09-20'
    });

    expect(apiClient.put).toHaveBeenCalledWith('/reminder/v1/5', {
      name: 'Масло',
      description: null,
      recurrenceType: 'ONCE',
      intervalValue: null,
      intervalUnit: null,
      startDate: '2026-09-20'
    });
  });

  it('deleteReminder удаляет по id', async () => {
    await deleteReminder(3);

    expect(apiClient.delete).toHaveBeenCalledWith('/reminder/v1/3');
  });

  it('completeReminder дёргает complete без даты', async () => {
    await completeReminder(3);

    expect(apiClient.post).toHaveBeenCalledWith('/reminder/v1/3/complete', { actionDate: null });
  });

  it('skipReminder передаёт дату действия', async () => {
    await skipReminder(3, '2026-09-19');

    expect(apiClient.post).toHaveBeenCalledWith('/reminder/v1/3/skip', { actionDate: '2026-09-19' });
  });

  it('getReminderHistory запрашивает историю', async () => {
    await getReminderHistory(3);

    expect(apiClient.get).toHaveBeenCalledWith('/reminder/v1/3/history');
  });

  it('пробрасывает ошибку сети', async () => {
    apiClient.get.mockRejectedValueOnce(new Error('network'));

    await expect(getAllReminders()).rejects.toThrow('network');
  });
});
