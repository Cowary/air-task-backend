<template>
  <div class="container">
    <router-link to="/" class="back-button">← На главную</router-link>

    <h1>⏰ Управление напоминаниями</h1>
    <p class="subtitle">Создание, редактирование и отслеживание напоминаний</p>

    <div class="tab-bar">
      <button
        :class="['tab-btn', { active: activeTab === 'countdown' }]"
        @click="activeTab = 'countdown'"
      >
        📅 До события
      </button>
      <button
        :class="['tab-btn', { active: activeTab === 'manage' }]"
        @click="switchToManageTab"
      >
        ⚙️ Управление
      </button>
    </div>

    <!-- Таб: До события -->
    <div v-if="activeTab === 'countdown'">
      <div v-if="countdownLoading" class="loading">
        <div class="spinner"></div>
        <p>Загрузка напоминаний...</p>
      </div>

      <div v-else-if="countdownError" class="error-message">
        <p>❌ {{ countdownError }}</p>
        <button @click="loadCountdown" class="retry-btn">Повторить</button>
      </div>

      <div v-else-if="countdownList.length === 0" class="empty-message">
        <p>Нет предстоящих напоминаний</p>
      </div>

      <div v-else class="countdown-list">
        <div
          v-for="(item, index) in countdownList"
          :key="index"
          class="countdown-card"
          :class="urgencyClass(item.daysBeforeEvent)"
        >
          <div class="countdown-name">{{ item.name }}</div>
          <div class="countdown-date">
            {{ formatDate(item.reminderDateTime) }}
          </div>
          <div class="countdown-days">
            <span class="days-label">Дней до события:</span>
            <span v-if="item.daysBeforeEvent > 0">
              {{ item.daysBeforeEvent }} {{ pluralDays(item.daysBeforeEvent) }}
            </span>
            <span v-else-if="item.daysBeforeEvent === 0" class="text-warning">0 — Сегодня</span>
            <span v-else class="text-danger">
              просрочено на {{ Math.abs(item.daysBeforeEvent) }} {{ pluralDays(Math.abs(item.daysBeforeEvent)) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Таб: Управление -->
    <div v-if="activeTab === 'manage'">
      <div v-if="manageLoading" class="loading">
        <div class="spinner"></div>
        <p>Загрузка напоминаний...</p>
      </div>

      <div v-else-if="manageError" class="error-message">
        <p>❌ {{ manageError }}</p>
        <button @click="loadReminders" class="retry-btn">Повторить</button>
      </div>

      <div v-else class="content">
        <div class="toolbar">
          <div class="filter-group">
            <label for="filterPriority">Приоритет:</label>
            <select id="filterPriority" v-model="filterPriority">
              <option value="">Все приоритеты</option>
              <option value="HIGH">Высокий</option>
              <option value="MIDDLE">Средний</option>
              <option value="LOW">Низкий</option>
            </select>

            <label for="filterStatus">Статус:</label>
            <select id="filterStatus" v-model="filterStatus">
              <option value="">Все статусы</option>
              <option value="IN_PROGRESS">В работе</option>
              <option value="DONE">Выполнено</option>
              <option value="PAUSED">На паузе</option>
            </select>

            <label for="filterType">Тип:</label>
            <select id="filterType" v-model="filterType">
              <option value="">Все типы</option>
              <option value="ONCE">Одноразовое</option>
              <option value="REPEATABLE">Повторяемое</option>
            </select>
          </div>

          <button @click="openCreateModal" class="create-btn">+ Создать напоминание</button>
        </div>

        <div v-if="filteredReminders.length === 0" class="empty-message">
          <p>{{ reminders.length === 0 ? 'Нет напоминаний. Создайте первое напоминание!' : 'Нет напоминаний, соответствующих фильтрам' }}</p>
        </div>

        <div v-else class="reminder-list">
          <div v-for="reminder in filteredReminders" :key="reminder.id" class="reminder-card">
            <div class="reminder-info">
              <div class="reminder-header">
                <span class="reminder-priority" :class="`priority-${reminder.priority.toLowerCase()}`">
                  {{ getPriorityLabel(reminder.priority) }}
                </span>
                <span class="reminder-status" :class="`status-${reminder.status.toLowerCase()}`">
                  {{ getStatusLabel(reminder.status) }}
                </span>
                <span class="reminder-type-badge">{{ getTypeLabel(reminder.type) }}</span>
              </div>

              <div class="reminder-name">{{ reminder.name }}</div>

              <div class="reminder-meta">
                <span class="reminder-date">
                  📅 {{ formatDate(reminder.reminderDateTime) }}
                </span>
                <span class="reminder-created">
                  Создано: {{ formatDate(reminder.createdTs) }}
                </span>
              </div>
            </div>

            <div class="reminder-actions">
              <button @click="openEditModal(reminder)" class="action-btn edit-btn" title="Редактировать">✏️</button>
              <button @click="confirmDelete(reminder)" class="action-btn delete-btn" title="Удалить">🗑️</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно создания/редактирования -->
    <div v-if="showReminderModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <h3>{{ editingReminder ? 'Редактировать напоминание' : 'Создать новое напоминание' }}</h3>

        <form @submit.prevent="saveReminder" class="reminder-form">
          <div class="form-group">
            <label for="reminderName">Название напоминания *</label>
            <input
              id="reminderName"
              v-model.trim="reminderForm.name"
              type="text"
              required
              placeholder="Введите название напоминания"
            />
          </div>

          <div class="form-group">
            <label for="reminderPriority">Приоритет *</label>
            <select id="reminderPriority" v-model="reminderForm.priority" required>
              <option value="HIGH">Высокий</option>
              <option value="MIDDLE">Средний</option>
              <option value="LOW">Низкий</option>
            </select>
          </div>

          <div class="form-group">
            <label for="reminderStatus">Статус *</label>
            <select id="reminderStatus" v-model="reminderForm.status" required>
              <option value="IN_PROGRESS">В работе</option>
              <option value="DONE">Выполнено</option>
              <option value="PAUSED">На паузе</option>
            </select>
          </div>

          <div class="form-group">
            <label for="reminderType">Тип *</label>
            <select id="reminderType" v-model="reminderForm.type" required>
              <option value="ONCE">Одноразовое</option>
              <option value="REPEATABLE">Повторяемое</option>
            </select>
          </div>

          <div class="form-row">
            <div class="form-group form-group-half">
              <label for="reminderDate">Дата события *</label>
              <input
                id="reminderDate"
                v-model="reminderForm.reminderDate"
                type="date"
                required
              />
            </div>
            <div class="form-group form-group-half">
              <label for="reminderTime">Время события *</label>
              <input
                id="reminderTime"
                v-model="reminderForm.reminderTime"
                type="time"
                required
              />
            </div>
          </div>

          <div class="form-actions">
            <button type="button" @click="closeModal" class="cancel-btn">Отмена</button>
            <button type="submit" class="save-btn" :disabled="saving">
              {{ saving ? 'Сохранение...' : 'Сохранить' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Модальное окно подтверждения удаления -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
      <div class="modal-content modal-small" @click.stop>
        <h3>Подтверждение удаления</h3>
        <p>Вы уверены, что хотите удалить напоминание "{{ reminderToDelete?.name }}"?</p>
        <div class="form-actions">
          <button @click="closeDeleteModal" class="cancel-btn">Отмена</button>
          <button @click="deleteReminderAction" class="delete-btn-confirm" :disabled="deleting">
            {{ deleting ? 'Удаление...' : 'Удалить' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getRemindersCountdown, getReminders, createReminder, updateReminder, deleteReminder } from '../api/reminders.js';

export default {
  name: 'RemindersPage',

  data() {
    return {
      activeTab: 'countdown',

      // Countdown tab
      countdownList: [],
      countdownLoading: false,
      countdownError: null,

      // Manage tab
      reminders: [],
      manageLoading: false,
      manageError: null,

      // Filters
      filterPriority: '',
      filterStatus: '',
      filterType: '',

      // Modal create/edit
      showReminderModal: false,
      editingReminder: null,
      saving: false,
      reminderForm: {
        name: '',
        priority: 'MIDDLE',
        status: 'IN_PROGRESS',
        type: 'ONCE',
        reminderDate: '',
        reminderTime: ''
      },

      // Modal delete
      showDeleteModal: false,
      reminderToDelete: null,
      deleting: false
    };
  },

  computed: {
    filteredReminders() {
      return this.reminders.filter(reminder => {
        if (this.filterPriority && reminder.priority !== this.filterPriority) {
          return false;
        }
        if (this.filterStatus && reminder.status !== this.filterStatus) {
          return false;
        }
        if (this.filterType && reminder.type !== this.filterType) {
          return false;
        }
        return true;
      });
    }
  },

  methods: {
    async loadCountdown() {
      this.countdownLoading = true;
      this.countdownError = null;

      try {
        const response = await getRemindersCountdown();

        if (response.isSuccess) {
          this.countdownList = response.data || [];
        } else {
          this.countdownError = response.errorMessage || 'Неизвестная ошибка';
        }
      } catch (err) {
        this.countdownError = 'Не удалось загрузить напоминания. Проверьте, запущен ли сервер.';
        console.error('Ошибка загрузки countdown:', err);
      } finally {
        this.countdownLoading = false;
      }
    },

    async loadReminders() {
      this.manageLoading = true;
      this.manageError = null;

      try {
        const response = await getReminders();

        if (response.isSuccess) {
          this.reminders = response.data || [];
        } else {
          this.manageError = response.errorMessage || 'Неизвестная ошибка';
        }
      } catch (err) {
        this.manageError = 'Не удалось загрузить список напоминаний. Проверьте, запущен ли сервер.';
        console.error('Ошибка загрузки напоминаний:', err);
      } finally {
        this.manageLoading = false;
      }
    },

    switchToManageTab() {
      this.activeTab = 'manage';
      if (this.reminders.length === 0 && !this.manageLoading) {
        this.loadReminders();
      }
    },

    urgencyClass(days) {
      if (days < 0) return 'card-overdue';
      if (days <= 3) return 'card-urgent';
      if (days <= 14) return 'card-soon';
      return '';
    },

    pluralDays(count) {
      if (count >= 11 && count <= 14) return 'дней';
      const mod10 = count % 10;
      if (mod10 === 1) return 'день';
      if (mod10 >= 2 && mod10 <= 4) return 'дня';
      return 'дней';
    },

    getPriorityLabel(priority) {
      const labels = { 'HIGH': 'Высокий', 'MIDDLE': 'Средний', 'LOW': 'Низкий' };
      return labels[priority] || priority;
    },

    getStatusLabel(status) {
      const labels = { 'IN_PROGRESS': 'В работе', 'DONE': 'Выполнено', 'PAUSED': 'На паузе' };
      return labels[status] || status;
    },

    getTypeLabel(type) {
      const labels = { 'ONCE': 'Одноразовое', 'REPEATABLE': 'Повторяемое' };
      return labels[type] || type;
    },

    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },

    openCreateModal() {
      this.editingReminder = null;
      this.reminderForm = {
        name: '',
        priority: 'MIDDLE',
        status: 'IN_PROGRESS',
        type: 'ONCE',
        reminderDate: '',
        reminderTime: '00:00'
      };
      this.showReminderModal = true;
    },

    openEditModal(reminder) {
      this.editingReminder = reminder;
      const dt = new Date(reminder.reminderDateTime);
      const pad = (n) => String(n).padStart(2, '0');
      this.reminderForm = {
        name: reminder.name,
        priority: reminder.priority,
        status: reminder.status,
        type: reminder.type,
        reminderDate: `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`,
        reminderTime: `${pad(dt.getHours())}:${pad(dt.getMinutes())}`
      };
      this.showReminderModal = true;
    },

    closeModal() {
      this.showReminderModal = false;
      this.editingReminder = null;
      this.reminderForm = {
        name: '',
        priority: 'MIDDLE',
        status: 'IN_PROGRESS',
        type: 'ONCE',
        reminderDate: '',
        reminderTime: ''
      };
    },

    async saveReminder() {
      if (!this.reminderForm.name) {
        alert('Пожалуйста, введите название напоминания');
        return;
      }

      this.saving = true;

      try {
        const dateValue = (this.reminderForm.reminderDate && this.reminderForm.reminderTime)
          ? new Date(`${this.reminderForm.reminderDate}T${this.reminderForm.reminderTime}:00`).toISOString()
          : new Date().toISOString();

        let response;

        if (this.editingReminder) {
          response = await updateReminder({
            id: this.editingReminder.id,
            name: this.reminderForm.name,
            priority: this.reminderForm.priority,
            status: this.reminderForm.status,
            type: this.reminderForm.type,
            reminderDateTime: dateValue
          });
        } else {
          response = await createReminder({
            name: this.reminderForm.name,
            priority: this.reminderForm.priority,
            status: this.reminderForm.status,
            type: this.reminderForm.type,
            reminderDateTime: dateValue
          });
        }

        if (response.isSuccess) {
          this.closeModal();
          await this.loadReminders();
        } else {
          alert('Не удалось сохранить напоминание: ' + (response.errorMessage || 'Неизвестная ошибка'));
        }
      } catch (err) {
        alert('Ошибка при сохранении напоминания');
        console.error('Ошибка сохранения:', err);
      } finally {
        this.saving = false;
      }
    },

    confirmDelete(reminder) {
      this.reminderToDelete = reminder;
      this.showDeleteModal = true;
    },

    closeDeleteModal() {
      this.showDeleteModal = false;
      this.reminderToDelete = null;
    },

    async deleteReminderAction() {
      if (!this.reminderToDelete) return;

      this.deleting = true;

      try {
        const response = await deleteReminder(this.reminderToDelete.id);

        if (response.isSuccess) {
          this.closeDeleteModal();
          await this.loadReminders();
        } else {
          alert('Не удалось удалить напоминание: ' + (response.errorMessage || 'Неизвестная ошибка'));
        }
      } catch (err) {
        alert('Ошибка при удалении напоминания');
        console.error('Ошибка удаления:', err);
      } finally {
        this.deleting = false;
      }
    }
  },

  mounted() {
    this.loadCountdown();
  }
};
</script>

<style scoped>
.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

h1 {
  text-align: center;
  color: var(--text-primary);
  margin-bottom: 5px;
}

.subtitle {
  text-align: center;
  color: var(--text-secondary);
  margin-bottom: 20px;
}

.back-button {
  display: inline-block;
  padding: 8px 16px;
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  text-decoration: none;
  border-radius: 5px;
  font-size: 14px;
  margin-bottom: 15px;
  transition: background-color 0.2s;
}

.back-button:hover {
  background-color: var(--border-color);
}

/* Табы */
.tab-bar {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 25px;
}

.tab-btn {
  padding: 10px 28px;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  background-color: var(--bg-secondary);
  color: var(--text-secondary);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  border-color: var(--accent-primary);
  color: var(--text-primary);
}

.tab-btn.active {
  background-color: var(--accent-primary);
  color: white;
  border-color: var(--accent-primary);
}

/* Loading / Error / Empty */
.loading {
  text-align: center;
  padding: 50px;
}

.spinner {
  border: 4px solid var(--spinner-bg);
  border-top: 4px solid var(--accent-primary);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  text-align: center;
  padding: 30px;
  background-color: var(--accent-red-light);
  border-radius: 8px;
  color: var(--accent-red);
}

.retry-btn {
  margin-top: 15px;
  padding: 10px 20px;
  background-color: var(--accent-primary);
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.retry-btn:hover {
  background-color: #5a6fd6;
}

.empty-message {
  text-align: center;
  padding: 40px;
  color: var(--text-muted);
  background-color: var(--bg-tertiary);
  border-radius: 8px;
}

/* Countdown cards */
.countdown-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.countdown-card {
  padding: 20px;
  border-radius: 10px;
  background-color: var(--bg-secondary);
  border: 2px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s ease;
}

.countdown-card:hover {
  box-shadow: 0 2px 8px var(--shadow-color);
}

.countdown-card.card-overdue {
  border-color: var(--accent-red);
  background-color: var(--accent-red-light);
}

.countdown-card.card-urgent {
  border-color: var(--accent-orange);
  background-color: var(--accent-orange-light);
}

.countdown-card.card-soon {
  border-color: var(--accent-primary);
}

.countdown-name {
  font-size: 17px;
  font-weight: 500;
  color: var(--text-primary);
  flex: 1;
}

.countdown-date {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 20px;
  white-space: nowrap;
}

.countdown-days {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
}

.days-label {
  font-weight: 400;
  color: var(--text-muted);
  margin-right: 6px;
}

.text-warning {
  color: var(--accent-orange);
}

.text-danger {
  color: var(--accent-red);
}

/* Toolbar */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px;
  background-color: var(--bg-secondary);
  border-radius: 8px;
  flex-wrap: wrap;
  gap: 15px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-group label {
  font-size: 14px;
  color: var(--text-secondary);
}

.filter-group select {
  padding: 6px 12px;
  border: 1px solid var(--border-color);
  border-radius: 5px;
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  font-size: 14px;
}

.create-btn {
  padding: 10px 20px;
  background-color: var(--accent-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.create-btn:hover {
  background-color: #5a6fd6;
}

/* Reminder cards */
.reminder-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.reminder-card {
  padding: 18px 20px;
  border-radius: 8px;
  background-color: var(--bg-secondary);
  border: 2px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  transition: all 0.2s ease;
}

.reminder-card:hover {
  box-shadow: 0 2px 8px var(--shadow-color);
  border-color: var(--accent-primary);
}

.reminder-info {
  flex: 1;
}

.reminder-header {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.reminder-name {
  font-size: 17px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.reminder-meta {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.reminder-date,
.reminder-created {
  font-size: 13px;
  color: var(--text-muted);
}

.reminder-priority,
.reminder-status,
.reminder-type-badge {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 12px;
  font-weight: 500;
}

.priority-high {
  background-color: var(--accent-red-light);
  color: var(--accent-red);
}

.priority-middle {
  background-color: var(--accent-orange-light);
  color: var(--accent-orange);
}

.priority-low {
  background-color: var(--accent-green-light);
  color: var(--accent-green);
}

.status-in_progress {
  background-color: var(--accent-blue-light);
  color: var(--accent-primary);
}

.status-done {
  background-color: var(--accent-green-light);
  color: var(--accent-green);
}

.status-paused {
  background-color: var(--border-color);
  color: var(--text-muted);
}

.reminder-type-badge {
  background-color: var(--bg-tertiary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.reminder-actions {
  display: flex;
  gap: 8px;
  margin-left: 15px;
}

.action-btn {
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background-color: var(--bg-tertiary);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background-color: var(--border-color);
}

.edit-btn:hover {
  background-color: var(--accent-blue-light);
}

.delete-btn:hover {
  background-color: var(--accent-red-light);
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background-color: var(--bg-secondary);
  padding: 30px;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px var(--shadow-color);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-content h3 {
  color: var(--text-primary);
  margin-bottom: 20px;
  text-align: center;
}

.modal-small {
  max-width: 400px;
}

.modal-small p {
  color: var(--text-secondary);
  margin-bottom: 20px;
  text-align: center;
}

/* Form */
.reminder-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
}

.form-group input,
.form-group select {
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: 5px;
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  font-size: 14px;
  font-family: inherit;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.form-row {
  display: flex;
  gap: 12px;
}

.form-group-half {
  flex: 1;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 10px;
}

.cancel-btn,
.save-btn,
.delete-btn-confirm {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.cancel-btn {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
}

.cancel-btn:hover {
  background-color: var(--border-color);
}

.save-btn {
  background-color: var(--accent-primary);
  color: white;
}

.save-btn:hover:not(:disabled) {
  background-color: #5a6fd6;
}

.save-btn:disabled {
  background-color: var(--text-muted);
  cursor: not-allowed;
}

.delete-btn-confirm {
  background-color: var(--accent-red);
  color: white;
}

.delete-btn-confirm:hover:not(:disabled) {
  background-color: #c0392b;
}

.delete-btn-confirm:disabled {
  background-color: var(--text-muted);
  cursor: not-allowed;
}

/* Responsive */
@media (max-width: 768px) {
  .tab-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-group {
    flex-direction: column;
    align-items: stretch;
  }

  .countdown-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .countdown-date {
    margin: 0;
  }

  .reminder-card {
    flex-direction: column;
  }

  .reminder-actions {
    margin-left: 0;
    margin-top: 12px;
    justify-content: flex-end;
  }
}
</style>
