<template>
  <div class="reminders-panel">
    <div class="reminders-toolbar">
      <div class="reminders-title">
        <AppIcon name="repeat" :size="18" />
        <span>Напоминания</span>
        <span class="reminders-count">{{ reminders.length }}</span>
      </div>
      <div class="toolbar-actions">
        <button
          class="toggle-deleted"
          :class="{ active: showDeleted }"
          @click="toggleDeleted"
        >
          {{ showDeleted ? 'Скрыть удалённые' : 'Показать удалённые' }}
        </button>
        <button class="create-btn" @click="openCreateModal">
          <AppIcon name="plus" :size="16" />
          <span>Новое</span>
        </button>
      </div>
    </div>

    <div v-if="loading" class="state-block">
      <div class="spinner"></div>
      <span>Загрузка...</span>
    </div>

    <div v-else-if="error" class="state-block error-block">
      <span>{{ error }}</span>
      <button class="retry-btn" @click="load">Повторить</button>
    </div>

    <div v-else-if="reminders.length === 0" class="state-block empty-block">
      Напоминаний пока нет. Добавьте первое!
    </div>

    <div v-else class="reminders-list">
      <article
        v-for="reminder in reminders"
        :key="reminder.id"
        class="reminder-card"
        :class="{ 'is-overdue': reminder.overdue && !reminder.deleted, 'is-deleted': reminder.deleted }"
      >
        <h3 class="reminder-name">{{ reminder.name }}</h3>

        <div class="reminder-badges">
          <span class="type-badge">{{ typeLabel(reminder) }}</span>
          <span v-if="reminder.deleted" class="deleted-badge">Удалено</span>
          <span v-else-if="reminder.resolved" class="resolved-badge">Выполнено</span>
          <span v-else-if="reminder.overdue" class="overdue-badge">Просрочено</span>
        </div>

        <p v-if="reminder.description" class="reminder-description">{{ reminder.description }}</p>

        <div class="reminder-meta">
          <span class="reminder-due">
            <AppIcon name="calendar-days" :size="13" />
            Срок: {{ formatDateOnly(reminder.nextDueDate) }}
          </span>
          <span
            v-if="!reminder.deleted && !reminder.resolved"
            class="countdown"
            :class="{ 'countdown-overdue': reminder.overdue }"
          >
            {{ countdownText(reminder) }}
          </span>
        </div>

        <div class="reminder-last">
          <template v-if="reminder.lastActionDate">
            Последнее: {{ actionLabel(reminder.lastAction) }}
            {{ formatDateOnly(reminder.lastActionDate) }}
            <template v-if="reminder.daysSinceLastAction !== null && reminder.daysSinceLastAction !== undefined">
              (прошло {{ reminder.daysSinceLastAction }} {{ pluralDays(reminder.daysSinceLastAction) }})
            </template>
          </template>
          <template v-else>Ещё не выполнялось</template>
        </div>

        <div class="reminder-actions">
          <template v-if="!reminder.deleted">
            <button
              class="action-btn complete"
              title="Выполнено"
              aria-label="Отметить выполненным"
              :disabled="actionLoadingId === reminder.id"
              @click="resolve(reminder, 'complete')"
            >
              <AppIcon name="check" :size="15" />
              <span class="action-label">Выполнено</span>
            </button>
            <button
              class="action-btn skip"
              title="Пропустить"
              aria-label="Пропустить"
              :disabled="actionLoadingId === reminder.id"
              @click="resolve(reminder, 'skip')"
            >
              <AppIcon name="skip-forward" :size="15" />
              <span class="action-label">Пропустить</span>
            </button>
            <button
              class="action-btn"
              title="Редактировать"
              aria-label="Редактировать"
              @click="openEditModal(reminder)"
            >
              <AppIcon name="pencil" :size="15" />
            </button>
            <button
              class="action-btn danger"
              title="Удалить"
              aria-label="Удалить"
              @click="openDeleteModal(reminder)"
            >
              <AppIcon name="trash-2" :size="15" />
            </button>
          </template>
          <button
            class="action-btn"
            title="История"
            aria-label="История"
            @click="openHistoryModal(reminder)"
          >
            <AppIcon name="history" :size="15" />
          </button>
        </div>
      </article>
    </div>

    <ReminderFormModal
      :visible="showFormModal"
      :reminder="editingReminder"
      @close="closeFormModal"
      @saved="handleSaved"
    />

    <ReminderHistoryModal
      :visible="showHistoryModal"
      :reminder="historyReminder"
      @close="closeHistoryModal"
    />

    <Teleport to="body">
      <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
        <div class="modal-content modal-small" @click.stop>
          <h3>Подтверждение удаления</h3>
          <p>
            Удалить напоминание «{{ reminderToDelete?.name }}»?
            История выполнения сохранится.
          </p>
          <div class="form-actions">
            <button @click="closeDeleteModal" class="cancel-btn">Отмена</button>
            <button @click="confirmDelete" class="delete-btn-confirm" :disabled="deleting">
              {{ deleting ? 'Удаление...' : 'Удалить' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script>
import { getAllReminders, deleteReminder, completeReminder, skipReminder } from '../../api/reminders.js';
import ReminderFormModal from './ReminderFormModal.vue';
import ReminderHistoryModal from './ReminderHistoryModal.vue';

export default {
  name: 'RemindersPanel',

  components: {
    ReminderFormModal,
    ReminderHistoryModal
  },

  emits: ['changed'],

  data() {
    return {
      reminders: [],
      loading: false,
      error: null,
      showDeleted: false,
      actionLoadingId: null,
      showFormModal: false,
      editingReminder: null,
      showHistoryModal: false,
      historyReminder: null,
      showDeleteModal: false,
      reminderToDelete: null,
      deleting: false
    };
  },

  methods: {
    async load() {
      this.loading = true;
      this.error = null;
      try {
        const response = await getAllReminders({ includeDeleted: this.showDeleted });
        if (response.isSuccess) {
          this.reminders = response.data || [];
        } else {
          this.error = response.errorMessage || 'Не удалось загрузить напоминания';
        }
      } catch (err) {
        console.error('Ошибка загрузки напоминаний:', err);
        this.error = 'Не удалось загрузить напоминания';
      } finally {
        this.loading = false;
      }
    },

    toggleDeleted() {
      this.showDeleted = !this.showDeleted;
      this.load();
    },

    formatDateOnly(dateString) {
      if (!dateString) return '';
      const [year, month, day] = String(dateString).split('T')[0].split('-');
      if (!year || !month || !day) return dateString;
      return `${day}.${month}.${year}`;
    },

    pluralDays(count) {
      const mod10 = count % 10;
      const mod100 = count % 100;
      if (mod10 === 1 && mod100 !== 11) return 'день';
      if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'дня';
      return 'дней';
    },

    countdownText(reminder) {
      const days = reminder.daysUntilDue;
      if (days === null || days === undefined) return '';
      if (days < 0) return `Просрочено на ${Math.abs(days)} ${this.pluralDays(Math.abs(days))}`;
      if (days === 0) return 'Сегодня';
      return `Осталось ${days} ${this.pluralDays(days)}`;
    },

    typeLabel(reminder) {
      switch (reminder.recurrenceType) {
        case 'INTERVAL': {
          const units = { DAYS: 'дн.', MONTHS: 'мес.', YEARS: 'лет' };
          return `Каждые ${reminder.intervalValue} ${units[reminder.intervalUnit] || ''}`.trim();
        }
        case 'MONTHLY':
          return 'Ежемесячно';
        case 'ANNUAL':
          return 'Ежегодно';
        default:
          return 'Один раз';
      }
    },

    actionLabel(action) {
      if (action === 'COMPLETED') return 'выполнено';
      if (action === 'SKIPPED') return 'пропущено';
      return '';
    },

    openCreateModal() {
      this.editingReminder = null;
      this.showFormModal = true;
    },

    openEditModal(reminder) {
      this.editingReminder = reminder;
      this.showFormModal = true;
    },

    closeFormModal() {
      this.showFormModal = false;
      this.editingReminder = null;
    },

    handleSaved() {
      this.load();
      this.$emit('changed');
    },

    async resolve(reminder, action) {
      this.actionLoadingId = reminder.id;
      try {
        const response = action === 'complete'
          ? await completeReminder(reminder.id)
          : await skipReminder(reminder.id);
        if (response.isSuccess) {
          await this.load();
          this.$emit('changed');
        } else {
          alert('Не удалось обновить напоминание: ' + (response.errorMessage || 'Неизвестная ошибка'));
        }
      } catch (err) {
        alert('Ошибка при обновлении напоминания');
        console.error('Ошибка выполнения/пропуска напоминания:', err);
      } finally {
        this.actionLoadingId = null;
      }
    },

    openDeleteModal(reminder) {
      this.reminderToDelete = reminder;
      this.showDeleteModal = true;
    },

    closeDeleteModal() {
      this.showDeleteModal = false;
      this.reminderToDelete = null;
    },

    async confirmDelete() {
      if (!this.reminderToDelete) return;
      this.deleting = true;
      try {
        const response = await deleteReminder(this.reminderToDelete.id);
        if (response.isSuccess) {
          this.closeDeleteModal();
          await this.load();
          this.$emit('changed');
        } else {
          alert('Не удалось удалить напоминание: ' + (response.errorMessage || 'Неизвестная ошибка'));
        }
      } catch (err) {
        alert('Ошибка при удалении напоминания');
        console.error('Ошибка удаления напоминания:', err);
      } finally {
        this.deleting = false;
      }
    },

    openHistoryModal(reminder) {
      this.historyReminder = reminder;
      this.showHistoryModal = true;
    },

    closeHistoryModal() {
      this.showHistoryModal = false;
      this.historyReminder = null;
    }
  },

  mounted() {
    this.load();
  }
};
</script>

<style scoped>
.reminders-panel {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.reminders-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
}

.reminders-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.reminders-count {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--neon-cyan);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 2px 8px;
}

.toolbar-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.toggle-deleted {
  padding: 9px 14px;
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 13px;
  cursor: pointer;
  transition: color var(--transition-base), border-color var(--transition-base);
}

.toggle-deleted:hover,
.toggle-deleted.active {
  color: var(--neon-cyan);
  border-color: var(--accent-primary);
}

.create-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background-color: var(--accent-primary);
  color: var(--on-neon);
  border: none;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: filter var(--transition-base), box-shadow var(--transition-base);
}

.create-btn:hover {
  filter: brightness(1.1);
  box-shadow: var(--glow-cyan);
}

.state-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 40px 20px;
  color: var(--text-muted);
  background-color: var(--bg-secondary);
  border: 1px dashed var(--border-color);
  border-radius: var(--radius-md);
}

.error-block {
  color: var(--neon-red);
  border-color: var(--accent-red);
}

.spinner {
  border: 3px solid var(--spinner-bg);
  border-top: 3px solid var(--accent-primary);
  border-radius: 50%;
  width: 28px;
  height: 28px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.retry-btn {
  padding: 8px 16px;
  background-color: var(--accent-primary);
  color: var(--on-neon);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.reminders-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
}

.reminder-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-left: 3px solid var(--entity-reminder);
  border-radius: var(--radius-md);
  transition: border-color var(--transition-base), box-shadow var(--transition-base);
}

.reminder-card.is-overdue {
  border-color: color-mix(in srgb, var(--neon-red) 40%, var(--border-light));
  border-left-color: var(--entity-reminder);
  box-shadow: var(--glow-red);
}

.reminder-card.is-deleted {
  opacity: 0.55;
}

.reminder-name {
  margin: 0;
  font-size: 1.05rem;
  color: var(--text-primary);
  word-break: break-word;
}

.reminder-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 8px;
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-family: var(--font-mono);
  cursor: pointer;
  transition: color var(--transition-base), background-color var(--transition-base),
    border-color var(--transition-base);
}

.action-btn:hover:not(:disabled) {
  color: var(--neon-cyan);
  background-color: var(--bg-tertiary);
  border-color: var(--border-light);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn.complete:hover:not(:disabled) {
  color: var(--neon-green);
}

.action-btn.skip:hover:not(:disabled) {
  color: var(--neon-amber);
}

.action-btn.danger:hover:not(:disabled) {
  color: var(--neon-red);
}

.reminder-badges {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.type-badge,
.deleted-badge,
.resolved-badge,
.overdue-badge {
  font-size: 11px;
  padding: 2px 9px;
  border-radius: 12px;
  font-weight: 500;
  font-family: var(--font-mono);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.type-badge {
  background-color: var(--bg-tertiary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.deleted-badge {
  background-color: var(--accent-gray-light);
  color: var(--accent-gray);
}

.resolved-badge {
  background-color: var(--accent-green-light);
  color: var(--accent-green);
}

.overdue-badge {
  background-color: var(--accent-red-light);
  color: var(--accent-red);
  border: 1px solid color-mix(in srgb, currentColor 45%, transparent);
}

.reminder-description {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.92rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.reminder-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 13px;
  color: var(--text-secondary);
}

.reminder-due {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: var(--font-mono);
}

.countdown {
  font-weight: 600;
  color: var(--neon-green);
}

.countdown-overdue {
  color: var(--neon-red);
}

.reminder-last {
  margin-top: auto;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.04em;
  color: var(--text-muted);
}

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
  max-width: 460px;
  width: 92%;
  box-shadow: var(--shadow-elevated), var(--glow-violet);
}

.modal-content h3 {
  color: var(--text-primary);
  margin-bottom: 16px;
  text-align: center;
}

.modal-content p {
  color: var(--text-secondary);
  text-align: center;
  margin: 0 0 8px;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 18px;
}

.cancel-btn,
.delete-btn-confirm {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.cancel-btn {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
}

.cancel-btn:hover {
  background-color: var(--border-color);
}

.delete-btn-confirm {
  background-color: var(--accent-red);
  color: var(--on-neon);
}

.delete-btn-confirm:hover:not(:disabled) {
  filter: brightness(1.12);
}

.delete-btn-confirm:disabled {
  background-color: var(--text-muted);
  cursor: not-allowed;
}

@media (max-width: 600px) {
  .action-label {
    display: none;
  }

  .reminders-list {
    grid-template-columns: 1fr;
  }
}
</style>
