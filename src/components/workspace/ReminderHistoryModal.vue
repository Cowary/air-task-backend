<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <h3>История: {{ reminder?.name }}</h3>

        <div v-if="loading" class="history-state">
          <div class="spinner"></div>
        </div>

        <div v-else-if="error" class="history-state error-text">{{ error }}</div>

        <div v-else-if="history.length === 0" class="history-state">
          История пуста.
        </div>

        <ul v-else class="history-list">
          <li v-for="entry in history" :key="entry.id" class="history-item">
            <span
              class="history-action"
              :class="entry.action === 'COMPLETED' ? 'action-completed' : 'action-skipped'"
            >
              {{ actionLabel(entry.action) }}
            </span>
            <span class="history-date">{{ formatDate(entry.actionDate) }}</span>
            <span v-if="entry.dueDate" class="history-due">срок: {{ formatDate(entry.dueDate) }}</span>
          </li>
        </ul>

        <div class="form-actions">
          <button type="button" @click="closeModal" class="cancel-btn">Закрыть</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script>
import { getReminderHistory } from '../../api/reminders.js';

export default {
  name: 'ReminderHistoryModal',

  props: {
    visible: {
      type: Boolean,
      required: true
    },
    reminder: {
      type: Object,
      default: null
    }
  },

  emits: ['close'],

  data() {
    return {
      loading: false,
      error: null,
      history: []
    };
  },

  watch: {
    visible(newVisible) {
      if (newVisible && this.reminder) {
        this.loadHistory();
      }
    }
  },

  methods: {
    formatDate(dateString) {
      if (!dateString) return '';
      const [year, month, day] = String(dateString).split('T')[0].split('-');
      if (!year || !month || !day) return dateString;
      return `${day}.${month}.${year}`;
    },

    actionLabel(action) {
      return action === 'COMPLETED' ? 'Выполнено' : 'Пропущено';
    },

    async loadHistory() {
      this.loading = true;
      this.error = null;
      try {
        const response = await getReminderHistory(this.reminder.id);
        if (response.isSuccess) {
          this.history = response.data || [];
        } else {
          this.error = response.errorMessage || 'Не удалось загрузить историю';
        }
      } catch (err) {
        console.error('Ошибка загрузки истории:', err);
        this.error = 'Ошибка загрузки истории';
      } finally {
        this.loading = false;
      }
    },

    closeModal() {
      this.$emit('close');
    }
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--overlay-scrim);
  backdrop-filter: blur(3px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
  animation: screen-fade var(--transition-base);
}

.modal-content {
  background-color: var(--bg-secondary);
  border: 1px solid color-mix(in srgb, var(--neon-violet) 40%, var(--border-light));
  padding: 30px;
  border-radius: var(--radius-lg);
  max-width: 480px;
  width: 92%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: var(--shadow-elevated), var(--glow-violet);
}

.modal-content h3 {
  color: var(--text-primary);
  margin-bottom: 18px;
  text-align: center;
}

.history-state {
  text-align: center;
  color: var(--text-muted);
  padding: 18px 0;
}

.error-text {
  color: var(--neon-red);
}

.spinner {
  border: 3px solid var(--spinner-bg);
  border-top: 3px solid var(--accent-primary);
  border-radius: 50%;
  width: 28px;
  height: 28px;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.history-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
}

.history-action {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 12px;
}

.action-completed {
  background-color: var(--accent-green-light);
  color: var(--accent-green);
}

.action-skipped {
  background-color: var(--accent-gray-light);
  color: var(--accent-gray);
}

.history-date {
  font-size: 13px;
  color: var(--text-primary);
}

.history-due {
  margin-left: auto;
  font-size: 12px;
  color: var(--text-muted);
  font-family: var(--font-mono);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
}

.cancel-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
}

.cancel-btn:hover {
  background-color: var(--border-color);
}
</style>
