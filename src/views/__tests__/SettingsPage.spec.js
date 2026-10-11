import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
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

function readRepoFile(relative) {
  return readFileSync(new URL(relative, import.meta.url), 'utf8');
}

describe('SettingsPage — адрес MCP-сервера (B11)', () => {
  it('показывает MCP-адрес на origin фронта', () => {
    const wrapper = mountPage();

    expect(wrapper.vm.endpointUrl).toBe(`${window.location.origin}/mcp`);
  });

  it('nginx проксирует /mcp на backend, иначе адрес недоступен', () => {
    const conf = readRepoFile('../../../nginx.conf.template');

    expect(conf).toMatch(/location\s+\/mcp\b/);
    expect(conf).toContain('${BACKEND_ORIGIN}');
  });

  it('vite проксирует /mcp в dev-режиме', () => {
    const conf = readRepoFile('../../../vite.config.js');

    expect(conf).toContain("'/mcp'");
  });
});
