<template>
  <div class="settings-container">
    <div class="settings-content">
      <header class="settings-head">
        <router-link to="/" class="back-button">
          <AppIcon name="arrow-left" :size="15" aria-hidden="true" />
          На главную
        </router-link>
        <h1 class="settings-title">
          <AppIcon name="settings" :size="22" aria-hidden="true" />
          Настройки
        </h1>
        <p class="settings-subtitle">Параметры системы.</p>
      </header>

      <section class="settings-section settings-section--display">
        <h2 class="section-title">
          <AppIcon name="calendar-days" :size="16" aria-hidden="true" />
          Отображение
        </h2>
        <p class="section-hint">
          С какого дня начинается неделя в weekly-статистике, на канбан-доске и в календаре.
        </p>
        <div v-if="loading" class="empty-message">Загрузка...</div>
        <template v-else>
          <div class="display-row">
            <label for="firstDayOfWeek">Первый день недели</label>
            <select id="firstDayOfWeek" v-model="form.firstDayOfWeek" class="filter-select">
              <option value="SUNDAY">Воскресенье</option>
              <option value="MONDAY">Понедельник</option>
            </select>
          </div>
          <div class="form-actions">
            <span v-if="savedDisplayMessage" class="saved-message">{{ savedDisplayMessage }}</span>
            <button type="button" class="save-btn" :disabled="savingDisplay" @click="saveDisplay">
              {{ savingDisplay ? 'Сохранение...' : 'Сохранить' }}
            </button>
          </div>
        </template>
      </section>

      <section class="settings-section settings-section--mcp">
        <h2 class="section-title">
          <AppIcon name="key" :size="16" aria-hidden="true" />
          Агенты (MCP)
        </h2>
        <p class="section-hint">
          API-ключи для подключения внешних агентов к MCP-серверу. Агент подключается к адресу
          ниже по транспорту Streamable HTTP и передаёт ключ в заголовке
          <code>X-API-Key</code>.
        </p>

        <div class="display-row">
          <label for="mcpEndpoint">Адрес MCP-сервера</label>
          <div class="code-row">
            <input id="mcpEndpoint" v-model="endpointUrl" class="code-input" readonly />
            <button type="button" class="icon-btn" title="Скопировать адрес" @click="copyText(endpointUrl)">
              <AppIcon name="copy" :size="15" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div v-if="mcpLoading" class="empty-message">Загрузка...</div>
        <template v-else>
          <div v-if="!keys.length" class="empty-message">Ключей пока нет. Создайте первый ключ для агента.</div>
          <div v-else class="table-scroll">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Имя</th>
                  <th>Ключ</th>
                  <th>Создан</th>
                  <th>Последнее использование</th>
                  <th>Статус</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="key in keys" :key="key.id">
                  <td>{{ key.name }}</td>
                  <td class="mono">{{ key.keyPrefix }}...</td>
                  <td class="mono">{{ formatTs(key.createdTs) }}</td>
                  <td class="mono">{{ key.lastUsedTs ? formatTs(key.lastUsedTs) : '—' }}</td>
                  <td>
                    <span class="badge" :class="key.revoked ? 'badge--danger' : 'badge--ok'">
                      {{ key.revoked ? 'Отозван' : 'Активен' }}
                    </span>
                  </td>
                  <td class="actions-cell">
                    <button
                      v-if="!key.revoked"
                      type="button"
                      class="ghost-btn ghost-btn--danger"
                      @click="openRevokeModal(key)"
                    >
                      <AppIcon name="ban" :size="14" aria-hidden="true" />
                      Отозвать
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="form-actions">
            <button type="button" class="save-btn" @click="openCreateModal">
              <AppIcon name="plus" :size="14" aria-hidden="true" />
              Создать ключ
            </button>
          </div>
        </template>
      </section>

      <section class="settings-section settings-section--audit">
        <h2 class="section-title">
          <AppIcon name="scroll-text" :size="16" aria-hidden="true" />
          Журнал действий агентов
        </h2>
        <p class="section-hint">Последние вызовы инструментов через MCP: кто, что и с каким результатом.</p>

        <div v-if="auditLoading" class="empty-message">Загрузка...</div>
        <template v-else>
          <div v-if="!audit.length" class="empty-message">Записей пока нет.</div>
          <div v-else class="table-scroll">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Время</th>
                  <th>Ключ</th>
                  <th>Инструмент</th>
                  <th>Статус</th>
                  <th>Длительность</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="entry in audit" :key="entry.id">
                  <td class="mono">{{ formatTs(entry.createdTs) }}</td>
                  <td>{{ entry.apiKeyName || '—' }}</td>
                  <td class="mono">{{ entry.toolName }}</td>
                  <td>
                    <span class="badge" :class="entry.status === 'SUCCESS' ? 'badge--ok' : 'badge--danger'">
                      {{ entry.status }}
                    </span>
                  </td>
                  <td class="mono">{{ entry.durationMs != null ? entry.durationMs + ' мс' : '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="form-actions">
            <button type="button" class="ghost-btn" :disabled="auditLoading" @click="loadAudit">
              <AppIcon name="refresh-cw" :size="14" aria-hidden="true" />
              Обновить
            </button>
          </div>
        </template>
      </section>
    </div>

    <Teleport to="body">
      <div v-if="showCreateModal" class="modal-overlay" @click="closeCreateModal">
        <div class="modal-content" @click.stop>
          <h3 class="modal-title">Новый MCP-ключ</h3>
          <p class="modal-hint">Укажите имя, чтобы потом понять, какому агенту принадлежит ключ.</p>
          <div class="display-row">
            <label for="mcpKeyName">Имя ключа</label>
            <input
              id="mcpKeyName"
              v-model="keyName"
              class="text-input"
              type="text"
              maxlength="128"
              placeholder="Например, Claude Code"
              @keyup.enter="submitCreateKey"
            />
          </div>
          <p v-if="createError" class="modal-error">{{ createError }}</p>
          <div class="modal-actions">
            <button type="button" class="cancel-btn" @click="closeCreateModal">Отмена</button>
            <button type="button" class="save-btn" :disabled="creatingKey || !keyName.trim()" @click="submitCreateKey">
              {{ creatingKey ? 'Создание...' : 'Создать' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="createdKey" class="modal-overlay" @click="closeCreatedModal">
        <div class="modal-content" @click.stop>
          <h3 class="modal-title">Ключ создан</h3>
          <p class="modal-hint modal-hint--warning">
            Скопируйте ключ сейчас. После закрытия окна он больше не будет показан.
          </p>
          <div class="display-row">
            <label for="createdKeyValue">API-ключ</label>
            <div class="code-row">
              <input id="createdKeyValue" :value="createdKey.key" class="code-input" readonly />
              <button type="button" class="icon-btn" title="Скопировать ключ" @click="copyText(createdKey.key)">
                <AppIcon name="copy" :size="15" aria-hidden="true" />
              </button>
            </div>
          </div>
          <div class="display-row">
            <label for="createdKeyEndpoint">Адрес MCP-сервера</label>
            <div class="code-row">
              <input id="createdKeyEndpoint" :value="endpointUrl" class="code-input" readonly />
              <button type="button" class="icon-btn" title="Скопировать адрес" @click="copyText(endpointUrl)">
                <AppIcon name="copy" :size="15" aria-hidden="true" />
              </button>
            </div>
          </div>
          <p v-if="copiedMessage" class="saved-message">{{ copiedMessage }}</p>
          <div class="modal-actions">
            <button type="button" class="save-btn" @click="closeCreatedModal">Готово</button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="keyToRevoke" class="modal-overlay" @click="closeRevokeModal">
        <div class="modal-content modal-small" @click.stop>
          <h3 class="modal-title">Отозвать ключ?</h3>
          <p class="modal-hint">
            Ключ «{{ keyToRevoke.name }}» будет отозван. Агенты, использующие его, потеряют доступ немедленно.
          </p>
          <div class="modal-actions">
            <button type="button" class="cancel-btn" @click="closeRevokeModal">Отмена</button>
            <button type="button" class="delete-btn-confirm" :disabled="revokingKey" @click="confirmRevoke">
              {{ revokingKey ? 'Отзыв...' : 'Отозвать' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script>
import AppIcon from '../components/AppIcon.vue';
import { useSettings, loadSettings, saveFirstDayOfWeek } from '../store/settings.js';
import {
  useMcp,
  loadMcpKeys,
  createKey,
  revokeKey,
  loadMcpAudit,
  resetMcp
} from '../store/mcp.js';

export default {
  name: 'SettingsPage',

  components: {
    AppIcon
  },

  data() {
    return {
      loading: true,
      savingDisplay: false,
      savedDisplayMessage: null,
      form: {
        firstDayOfWeek: 'SUNDAY'
      },
      endpointUrl: `${window.location.origin}/mcp`,
      showCreateModal: false,
      keyName: '',
      creatingKey: false,
      createError: null,
      createdKey: null,
      keyToRevoke: null,
      revokingKey: false,
      copiedMessage: null,
      auditLoading: false
    };
  },

  computed: {
    mcp() {
      return useMcp();
    },
    keys() {
      return this.mcp.keys;
    },
    audit() {
      return this.mcp.audit;
    },
    mcpLoading() {
      return this.mcp.loadingKeys;
    }
  },

  methods: {
    async load() {
      this.loading = true;
      try {
        await loadSettings();
        const settings = useSettings();
        this.form.firstDayOfWeek = settings.firstDayOfWeek;
      } catch (error) {
        alert('Не удалось загрузить настройки. Проверьте, запущен ли сервер.');
        console.error('Ошибка загрузки настроек:', error);
      } finally {
        this.loading = false;
      }
    },

    async saveDisplay() {
      this.savingDisplay = true;
      this.savedDisplayMessage = null;
      try {
        const response = await saveFirstDayOfWeek(this.form.firstDayOfWeek);
        if (response.isSuccess) {
          this.savedDisplayMessage = 'Сохранено';
          setTimeout(() => {
            this.savedDisplayMessage = null;
          }, 2500);
        } else {
          alert(response.errorMessage || 'Не удалось сохранить настройки');
        }
      } catch (error) {
        alert('Ошибка при сохранении настроек');
        console.error('Ошибка сохранения настроек отображения:', error);
      } finally {
        this.savingDisplay = false;
      }
    },

    async loadKeys() {
      try {
        await loadMcpKeys();
      } catch (error) {
        console.error('Ошибка загрузки MCP-ключей:', error);
      }
    },

    async loadAudit() {
      this.auditLoading = true;
      try {
        await loadMcpAudit({ limit: 20, offset: 0 });
      } catch (error) {
        alert('Не удалось загрузить журнал действий');
      } finally {
        this.auditLoading = false;
      }
    },

    openCreateModal() {
      this.keyName = '';
      this.createError = null;
      this.showCreateModal = true;
    },

    closeCreateModal() {
      this.showCreateModal = false;
      this.createError = null;
    },

    async submitCreateKey() {
      const name = this.keyName.trim();
      if (!name) {
        return;
      }
      this.creatingKey = true;
      this.createError = null;
      try {
        const response = await createKey(name);
        if (response.isSuccess) {
          this.showCreateModal = false;
          this.createdKey = response.data;
        } else {
          this.createError = response.errorMessage || 'Не удалось создать ключ';
        }
      } catch (error) {
        this.createError = 'Ошибка при создании ключа';
        console.error('Ошибка создания MCP-ключа:', error);
      } finally {
        this.creatingKey = false;
      }
    },

    closeCreatedModal() {
      this.createdKey = null;
      this.copiedMessage = null;
    },

    copyText(text) {
      if (!text) {
        return;
      }
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          this.copiedMessage = 'Скопировано';
          setTimeout(() => {
            this.copiedMessage = null;
          }, 2000);
        });
      } else {
        alert('Копирование недоступно в этом браузере');
      }
    },

    openRevokeModal(key) {
      this.keyToRevoke = key;
    },

    closeRevokeModal() {
      this.keyToRevoke = null;
    },

    async confirmRevoke() {
      if (!this.keyToRevoke) {
        return;
      }
      this.revokingKey = true;
      try {
        const response = await revokeKey(this.keyToRevoke.id);
        if (response.isSuccess) {
          this.keyToRevoke = null;
          await this.loadAudit();
        } else {
          alert(response.errorMessage || 'Не удалось отозвать ключ');
        }
      } catch (error) {
        alert('Ошибка при отзыве ключа');
        console.error('Ошибка отзыва MCP-ключа:', error);
      } finally {
        this.revokingKey = false;
      }
    },

    formatTs(value) {
      if (!value) {
        return '—';
      }
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        return value;
      }
      return date.toLocaleString('ru-RU');
    }
  },

  mounted() {
    this.load();
    this.loadKeys();
    this.loadAudit();
  },

  beforeUnmount() {
    resetMcp();
  }
};
</script>

<style scoped>
.settings-container {
  display: flex;
  justify-content: center;
  padding: 80px 20px 40px;
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  max-width: 720px;
  padding: 28px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-elevated);
  animation: screen-rise var(--transition-slow) both;
}

.settings-head {
  margin-bottom: 6px;
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 14px;
  font-family: var(--font-mono);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-secondary);
  text-decoration: none;
}

.back-button:hover {
  color: var(--neon-violet);
}

.settings-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  font-family: var(--font-display);
  font-size: 24px;
  color: var(--text-primary);
}

.settings-subtitle {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--text-muted);
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-left: 3px solid var(--neon-cyan);
  border-radius: var(--radius-md);
}

.settings-section--mcp {
  border-left-color: var(--neon-violet);
}

.settings-section--audit {
  border-left-color: var(--neon-amber);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-family: var(--font-display);
  font-size: 16px;
  color: var(--text-primary);
}

.section-title :deep(svg) {
  color: var(--neon-cyan);
}

.settings-section--mcp .section-title :deep(svg) {
  color: var(--neon-violet);
}

.settings-section--audit .section-title :deep(svg) {
  color: var(--neon-amber);
}

.section-hint {
  margin: 0;
  font-size: 13px;
  color: var(--text-muted);
}

.section-hint code {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-secondary);
}

.form-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.saved-message {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--accent-green);
}

.save-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  font-family: var(--font-mono);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--on-neon);
  background: var(--neon-magenta);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: box-shadow var(--transition-base), transform var(--transition-fast);
}

.save-btn:hover:not(:disabled) {
  box-shadow: var(--glow-magenta);
}

.save-btn:active:not(:disabled) {
  transform: translateY(1px);
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.ghost-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-family: var(--font-mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: color var(--transition-fast), border-color var(--transition-fast);
}

.ghost-btn:hover:not(:disabled) {
  color: var(--neon-cyan);
  border-color: var(--border-neon);
}

.ghost-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.ghost-btn--danger:hover:not(:disabled) {
  color: var(--neon-red);
  border-color: var(--neon-red);
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: color var(--transition-fast), border-color var(--transition-fast);
}

.icon-btn:hover {
  color: var(--neon-cyan);
  border-color: var(--border-neon);
}

.empty-message {
  margin: 0;
  padding: 14px;
  font-size: 13px;
  color: var(--text-muted);
  text-align: center;
}

.display-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.display-row label {
  font-family: var(--font-mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-secondary);
}

.code-row {
  display: flex;
  align-items: stretch;
  gap: 8px;
}

.code-input,
.text-input,
.filter-select {
  width: 100%;
  padding: 8px 10px;
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--text-primary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
}

.code-input {
  color: var(--neon-cyan);
}

.filter-select:focus,
.text-input:focus {
  outline: 2px solid var(--neon-cyan);
  outline-offset: 1px;
}

.table-scroll {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.data-table th {
  padding: 8px 10px;
  font-family: var(--font-mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  text-align: left;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border-color);
  white-space: nowrap;
}

.data-table td {
  padding: 8px 10px;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
  vertical-align: middle;
}

.data-table .mono {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-secondary);
  white-space: nowrap;
}

.actions-cell {
  text-align: right;
}

.badge {
  display: inline-block;
  padding: 2px 8px;
  font-family: var(--font-mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-radius: 999px;
  border: 1px solid transparent;
}

.badge--ok {
  color: var(--accent-green);
  border-color: var(--accent-green);
}

.badge--danger {
  color: var(--neon-red);
  border-color: var(--neon-red);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal, 1100);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: var(--overlay-scrim);
  backdrop-filter: blur(3px);
  animation: screen-fade var(--transition-base) both;
}

.modal-content {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  max-width: 460px;
  padding: 22px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-neon);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-elevated), var(--glow-violet);
}

.modal-small {
  max-width: 380px;
}

.modal-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 18px;
  color: var(--text-primary);
}

.modal-hint {
  margin: 0;
  font-size: 13px;
  color: var(--text-muted);
}

.modal-hint--warning {
  color: var(--neon-amber);
}

.modal-error {
  margin: 0;
  font-size: 12px;
  color: var(--neon-red);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.cancel-btn {
  padding: 8px 16px;
  font-family: var(--font-mono);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-primary);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.delete-btn-confirm {
  padding: 8px 16px;
  font-family: var(--font-mono);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--on-neon);
  background: var(--neon-red);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.delete-btn-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
