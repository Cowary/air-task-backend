import { reactive } from 'vue';
import { listMcpKeys, createMcpKey, revokeMcpKey, listMcpAudit } from '../api/mcp.js';

const state = reactive({
  keys: [],
  audit: [],
  loadingKeys: false,
  loadingAudit: false,
  keysLoaded: false,
  error: null
});

let loadKeysPromise = null;

export function useMcp() {
  return state;
}

/**
 * Загружает список MCP-ключей один раз (или принудительно).
 */
export function loadMcpKeys(force = false) {
  if (state.keysLoaded && !force) {
    return Promise.resolve(state);
  }
  if (loadKeysPromise) {
    return loadKeysPromise;
  }
  loadKeysPromise = (async () => {
    state.loadingKeys = true;
    state.error = null;
    try {
      const response = await listMcpKeys();
      if (response.isSuccess) {
        state.keys = response.data || [];
      }
      state.keysLoaded = true;
    } catch (error) {
      console.error('Ошибка загрузки MCP-ключей:', error);
      state.error = 'Не удалось загрузить ключи';
    } finally {
      state.loadingKeys = false;
      loadKeysPromise = null;
    }
    return state;
  })();
  return loadKeysPromise;
}

/**
 * Создаёт MCP-ключ и добавляет его в начало списка.
 */
export async function createKey(name) {
  const response = await createMcpKey({ name });
  if (response.isSuccess) {
    await loadMcpKeys(true);
  }
  return response;
}

/**
 * Отзывает MCP-ключ и обновляет список.
 */
export async function revokeKey(id) {
  const response = await revokeMcpKey(id);
  if (response.isSuccess) {
    await loadMcpKeys(true);
  }
  return response;
}

/**
 * Загружает журнал действий агентов.
 */
export async function loadMcpAudit(params = {}) {
  state.loadingAudit = true;
  state.error = null;
  try {
    const response = await listMcpAudit(params);
    if (response.isSuccess) {
      state.audit = response.data || [];
    }
    return response;
  } catch (error) {
    console.error('Ошибка загрузки журнала действий агентов:', error);
    state.error = 'Не удалось загрузить журнал';
    throw error;
  } finally {
    state.loadingAudit = false;
  }
}

/**
 * Сбрасывает стор (используется в тестах).
 */
export function resetMcp() {
  state.keys = [];
  state.audit = [];
  state.loadingKeys = false;
  state.loadingAudit = false;
  state.keysLoaded = false;
  state.error = null;
  loadKeysPromise = null;
}
