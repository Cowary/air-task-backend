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
import { listMcpKeys, createMcpKey, renameMcpKey, revokeMcpKey, listMcpAudit } from '../mcp.js';

describe('api/mcp.js', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiClient.get.mockResolvedValue({ data: { isSuccess: true, data: [] } });
    apiClient.post.mockResolvedValue({ data: { isSuccess: true, data: {} } });
    apiClient.put.mockResolvedValue({ data: { isSuccess: true, data: {} } });
  });

  it('listMcpKeys запрашивает список ключей', async () => {
    const response = await listMcpKeys();

    expect(apiClient.get).toHaveBeenCalledWith('/mcp/v1/key/list');
    expect(response).toEqual({ isSuccess: true, data: [] });
  });

  it('createMcpKey отправляет имя ключа через POST', async () => {
    await createMcpKey({ name: 'Claude Code' });

    expect(apiClient.post).toHaveBeenCalledWith('/mcp/v1/key', { name: 'Claude Code' });
  });

  it('renameMcpKey отправляет новое имя через PUT', async () => {
    await renameMcpKey(5, { name: 'CI agent' });

    expect(apiClient.put).toHaveBeenCalledWith('/mcp/v1/key/5', { name: 'CI agent' });
  });

  it('revokeMcpKey вызывает action-путь отзыва', async () => {
    await revokeMcpKey(5);

    expect(apiClient.post).toHaveBeenCalledWith('/mcp/v1/key/5/revoke');
  });

  it('listMcpAudit передаёт фильтры как параметры запроса', async () => {
    await listMcpAudit({ limit: 20, offset: 0, toolName: 'task_create' });

    expect(apiClient.get).toHaveBeenCalledWith('/mcp/v1/audit/list', {
      params: { limit: 20, offset: 0, toolName: 'task_create' }
    });
  });
});
