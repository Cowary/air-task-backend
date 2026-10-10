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
    </div>
  </div>
</template>

<script>
import AppIcon from '../components/AppIcon.vue';
import { useSettings, loadSettings, saveFirstDayOfWeek } from '../store/settings.js';

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
      }
    };
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
    }
  },

  mounted() {
    this.load();
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
  width: 100%;
  max-width: 640px;
  padding: 28px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-elevated);
  animation: screen-rise var(--transition-slow) both;
}

.settings-head {
  margin-bottom: 22px;
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

.section-hint {
  margin: 0;
  font-size: 13px;
  color: var(--text-muted);
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

.filter-select {
  width: 100%;
  padding: 8px 10px;
  font-family: var(--font-mono);
  font-size: 14px;
  color: var(--text-primary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
}

.filter-select:focus {
  outline: 2px solid var(--neon-cyan);
  outline-offset: 1px;
}
</style>
