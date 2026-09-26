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
        <p class="settings-subtitle">Параметры системы. Здесь же — тарифы геймификации.</p>
      </header>

      <section class="settings-section">
        <h2 class="section-title">
          <AppIcon name="coins" :size="16" aria-hidden="true" />
          Геймификация
        </h2>
        <p class="section-hint">
          Сколько монет начислять за выполнение. Бонус проекта — процент от суммы тарифов всех его задач.
        </p>

        <div v-if="loading" class="empty-message">Загрузка...</div>
        <form v-else @submit.prevent="handleSave" class="settings-form">
          <fieldset class="rate-group">
            <legend class="hud-label">Задачи</legend>
            <div class="rate-row">
              <label for="taskRewardHigh">HIGH</label>
              <input id="taskRewardHigh" v-model.number="form.taskRewardHigh" type="number" min="0" step="1" required />
            </div>
            <div class="rate-row">
              <label for="taskRewardMiddle">MIDDLE</label>
              <input id="taskRewardMiddle" v-model.number="form.taskRewardMiddle" type="number" min="0" step="1" required />
            </div>
            <div class="rate-row">
              <label for="taskRewardLow">LOW</label>
              <input id="taskRewardLow" v-model.number="form.taskRewardLow" type="number" min="0" step="1" required />
            </div>
          </fieldset>

          <fieldset class="rate-group">
            <legend class="hud-label">Weekly-задачи</legend>
            <div class="rate-row">
              <label for="weeklyRewardHigh">HIGH</label>
              <input id="weeklyRewardHigh" v-model.number="form.weeklyRewardHigh" type="number" min="0" step="1" required />
            </div>
            <div class="rate-row">
              <label for="weeklyRewardMiddle">MIDDLE</label>
              <input id="weeklyRewardMiddle" v-model.number="form.weeklyRewardMiddle" type="number" min="0" step="1" required />
            </div>
            <div class="rate-row">
              <label for="weeklyRewardLow">LOW</label>
              <input id="weeklyRewardLow" v-model.number="form.weeklyRewardLow" type="number" min="0" step="1" required />
            </div>
          </fieldset>

          <fieldset class="rate-group">
            <legend class="hud-label">Прочее</legend>
            <div class="rate-row">
              <label for="subtaskReward">Подзадача</label>
              <input id="subtaskReward" v-model.number="form.subtaskReward" type="number" min="0" step="1" required />
            </div>
            <div class="rate-row">
              <label for="projectBonusPercent">Бонус проекта, %</label>
              <input id="projectBonusPercent" v-model.number="form.projectBonusPercent" type="number" min="0" max="1000" step="1" required />
            </div>
          </fieldset>

          <div class="form-actions">
            <span v-if="savedMessage" class="saved-message">{{ savedMessage }}</span>
            <button type="submit" class="save-btn" :disabled="saving">
              {{ saving ? 'Сохранение...' : 'Сохранить' }}
            </button>
          </div>
        </form>
      </section>
    </div>
  </div>
</template>

<script>
import AppIcon from '../components/AppIcon.vue';
import { getGamificationSettings, updateGamificationSettings } from '../api/gamification.js';

export default {
  name: 'SettingsPage',

  components: {
    AppIcon
  },

  data() {
    return {
      loading: true,
      saving: false,
      savedMessage: null,
      form: {
        taskRewardHigh: 10,
        taskRewardMiddle: 5,
        taskRewardLow: 2,
        weeklyRewardHigh: 5,
        weeklyRewardMiddle: 3,
        weeklyRewardLow: 1,
        subtaskReward: 1,
        projectBonusPercent: 100
      }
    };
  },

  methods: {
    async load() {
      this.loading = true;
      try {
        const response = await getGamificationSettings();
        if (response.isSuccess && response.data) {
          this.form = {
            taskRewardHigh: response.data.taskRewardHigh ?? 10,
            taskRewardMiddle: response.data.taskRewardMiddle ?? 5,
            taskRewardLow: response.data.taskRewardLow ?? 2,
            weeklyRewardHigh: response.data.weeklyRewardHigh ?? 5,
            weeklyRewardMiddle: response.data.weeklyRewardMiddle ?? 3,
            weeklyRewardLow: response.data.weeklyRewardLow ?? 1,
            subtaskReward: response.data.subtaskReward ?? 1,
            projectBonusPercent: response.data.projectBonusPercent ?? 100
          };
        } else {
          alert(response.errorMessage || 'Не удалось загрузить настройки');
        }
      } catch (error) {
        alert('Не удалось загрузить настройки. Проверьте, запущен ли сервер.');
        console.error('Ошибка загрузки настроек:', error);
      } finally {
        this.loading = false;
      }
    },

    async handleSave() {
      this.saving = true;
      this.savedMessage = null;
      try {
        const response = await updateGamificationSettings({ ...this.form });
        if (response.isSuccess) {
          this.savedMessage = 'Сохранено';
          setTimeout(() => {
            this.savedMessage = null;
          }, 2500);
        } else {
          alert(response.errorMessage || 'Не удалось сохранить настройки');
        }
      } catch (error) {
        alert('Ошибка при сохранении настроек');
        console.error('Ошибка сохранения настроек:', error);
      } finally {
        this.saving = false;
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
  border-left: 3px solid var(--entity-rewards);
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
  color: var(--entity-rewards);
}

.section-hint {
  margin: 0;
  font-size: 13px;
  color: var(--text-muted);
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.rate-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 10px;
  margin: 0;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
}

.rate-group legend {
  padding: 0 6px;
}

.rate-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rate-row label {
  font-family: var(--font-mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-secondary);
}

.rate-row input {
  width: 100%;
  padding: 8px 10px;
  font-family: var(--font-mono);
  font-size: 14px;
  color: var(--text-primary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
}

.rate-row input:focus {
  outline: 2px solid var(--neon-cyan);
  outline-offset: 1px;
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
</style>
