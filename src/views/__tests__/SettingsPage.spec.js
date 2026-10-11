import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';

vi.mock('../../store/settings.js', () => ({
  useSettings: () => ({ firstDayOfWeek: 'SUNDAY' }),
  loadSettings: vi.fn().mockResolvedValue(),
  saveFirstDayOfWeek: vi.fn().mockResolvedValue({ isSuccess: true })
}));

vi.mock('../../store/mcp.js', () => ({
  useMcp: () => ({ keys: [], audit: [], loadingKeys: false, loadingAudit: false, error: null }),
  loadMcpKeys: vi.fn().mockResolvedValue(),
  createKey: vi.fn(),
  revokeKey: vi.fn(),
  loadMcpAudit: vi.fn().mockResolvedValue(),
  resetMcp: vi.fn()
}));

import SettingsPage from '../SettingsPage.vue';

function mountPage() {
  return mount(SettingsPage, { global: { stubs: { AppIcon: true } } });
}

describe('SettingsPage — адрес MCP-сервера (B11)', () => {
  beforeEach(() => {
    delete window.__AIR_TASK_CONFIG__;
  });

  afterEach(() => {
    delete window.__AIR_TASK_CONFIG__;
    vi.unstubAllEnvs();
  });

  it('показывает адрес backend из runtime-конфига, а не origin фронта', () => {
    window.__AIR_TASK_CONFIG__ = { backendUrl: 'http://192.168.1.77:8106' };

    const wrapper = mountPage();

    expect(wrapper.vm.endpointUrl).toBe('http://192.168.1.77:8106/mcp');
  });

  it('обрезает завершающий слэш в backend URL', () => {
    window.__AIR_TASK_CONFIG__ = { backendUrl: 'http://192.168.1.77:8106/' };

    const wrapper = mountPage();

    expect(wrapper.vm.endpointUrl).toBe('http://192.168.1.77:8106/mcp');
  });

  it('падает обратно на origin фронта, когда runtime-конфиг и VITE_BACKEND_URL пусты', () => {
    vi.stubEnv('VITE_BACKEND_URL', '');

    const wrapper = mountPage();

    expect(wrapper.vm.endpointUrl).toBe(`${window.location.origin}/mcp`);
  });
});
