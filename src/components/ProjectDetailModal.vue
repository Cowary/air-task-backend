<template>
  <div v-if="visible" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div v-if="loading" class="detail-loading">
        <div class="spinner"></div>
        <p>Загрузка проекта...</p>
      </div>

      <div v-else-if="error" class="detail-error">
        <p>❌ {{ error }}</p>
        <button @click="loadProject" class="retry-btn">Повторить</button>
      </div>

      <template v-else-if="project">
        <div class="detail-header">
          <h3>{{ project.name }}</h3>
          <button class="close-x" @click="closeModal" title="Закрыть">✕</button>
        </div>

        <div class="detail-badges">
          <span class="badge status-badge" :class="`status-${(project.status || '').toLowerCase()}`">
            {{ getStatusLabel(project.status) }}
          </span>
          <span class="badge priority-badge" :class="`priority-${(project.priority || '').toLowerCase()}`">
            {{ getPriorityLabel(project.priority) }}
          </span>
        </div>

        <div class="detail-dates">
          <span>Создан: {{ formatDate(project.createdTs) }}</span>
          <span>Обновлён: {{ formatDate(project.updatedTs) }}</span>
        </div>

        <div class="detail-section">
          <h4>
            📊 Еженедельные задачи
            <span class="section-count">{{ weeklyList.length }}</span>
          </h4>
          <div v-if="weeklyList.length === 0" class="section-empty">Нет привязанных еженедельных задач</div>
          <table v-else class="detail-table">
            <thead>
              <tr>
                <th>Название</th>
                <th>Кол-во</th>
                <th>Приоритет</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="weekly in weeklyList" :key="weekly.id">
                <td class="cell-name">{{ weekly.name }}</td>
                <td>{{ weekly.count }}</td>
                <td>
                  <span class="badge priority-badge" :class="`priority-${(weekly.priority || '').toLowerCase()}`">
                    {{ getPriorityLabel(weekly.priority) }}
                  </span>
                </td>
                <td>
                  <span class="badge status-badge" :class="`status-${(weekly.status || '').toLowerCase()}`">
                    {{ getStatusLabel(weekly.status) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="detail-section">
          <h4>
            📝 Задачи
            <span class="section-count">{{ taskList.length }}</span>
          </h4>
          <div v-if="taskList.length === 0" class="section-empty">Нет привязанных задач</div>
          <table v-else class="detail-table">
            <thead>
              <tr>
                <th>Название</th>
                <th>Описание</th>
                <th>Приоритет</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="task in taskList" :key="task.id">
                <td class="cell-name">{{ task.name }}</td>
                <td class="cell-description">{{ task.description || '—' }}</td>
                <td>
                  <span class="badge priority-badge" :class="`priority-${(task.priority || '').toLowerCase()}`">
                    {{ getPriorityLabel(task.priority) }}
                  </span>
                </td>
                <td>
                  <span class="badge status-badge" :class="`status-${(task.status || '').toLowerCase()}`">
                    {{ getStatusLabel(task.status) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="form-actions">
          <button @click="closeModal" class="cancel-btn">Закрыть</button>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import { getProjectById } from '../api/projects.js';

export default {
  name: 'ProjectDetailModal',

  props: {
    visible: {
      type: Boolean,
      required: true
    },
    projectId: {
      type: Number,
      default: null
    }
  },

  emits: ['close'],

  data() {
    return {
      project: null,
      loading: false,
      error: null
    };
  },

  computed: {
    weeklyList() {
      return this.project?.weeklyList || [];
    },

    taskList() {
      return this.project?.taskList || [];
    }
  },

  watch: {
    visible(newVisible) {
      if (newVisible && this.projectId) {
        this.loadProject();
      }
    }
  },

  methods: {
    async loadProject() {
      this.loading = true;
      this.error = null;
      this.project = null;

      try {
        const response = await getProjectById(this.projectId);

        if (response.isSuccess) {
          this.project = response.data;
        } else {
          this.error = response.errorMessage || 'Не удалось загрузить проект';
        }
      } catch (err) {
        this.error = 'Не удалось загрузить проект. Проверьте, запущен ли сервер.';
        console.error('Ошибка загрузки проекта:', err);
      } finally {
        this.loading = false;
      }
    },

    closeModal() {
      this.$emit('close');
    },

    getStatusLabel(status) {
      const labels = {
        'ACTIVE': 'Активный',
        'COMPLETED': 'Завершён',
        'ARCHIVED': 'Архивирован',
        'IDEA': 'Идея',
        'BACKLOG': 'Бэклог',
        'IN_PROGRESS': 'В работе',
        'DONE': 'Выполнено',
        'PAUSED': 'На паузе',
        'CANCELED': 'Отменено'
      };
      return labels[status] || status || '—';
    },

    getPriorityLabel(priority) {
      const labels = {
        'HIGH': 'Высокий',
        'MEDIUM': 'Средний',
        'MIDDLE': 'Средний',
        'LOW': 'Низкий'
      };
      return labels[priority] || priority || '—';
    },

    formatDate(dateString) {
      if (!dateString) return '—';
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
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
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1001;
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
  max-width: 700px;
  width: 92%;
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

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}

.detail-header h3 {
  color: var(--text-primary);
  margin: 0 0 12px 0;
  word-break: break-word;
}

.close-x {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background-color: var(--bg-tertiary);
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  flex-shrink: 0;
  transition: background-color 0.2s ease;
}

.close-x:hover {
  background-color: var(--border-color);
}

.detail-badges {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.badge {
  font-size: 12px;
  padding: 3px 12px;
  border-radius: 12px;
  font-weight: 500;
}

.priority-high {
  background-color: var(--accent-red-light);
  color: var(--accent-red);
}

.priority-middle,
.priority-medium {
  background-color: var(--accent-orange-light);
  color: var(--accent-orange);
}

.priority-low {
  background-color: var(--accent-green-light);
  color: var(--accent-green);
}

.status-active,
.status-in_progress {
  background-color: var(--accent-blue-light);
  color: var(--accent-blue);
}

.status-completed,
.status-done {
  background-color: var(--accent-green-light);
  color: var(--accent-green);
}

.status-archived,
.status-backlog {
  background-color: var(--accent-gray-light);
  color: var(--accent-gray);
}

.status-idea {
  background-color: var(--accent-purple-light);
  color: var(--accent-purple);
}

.status-paused {
  background-color: var(--accent-orange-light);
  color: var(--accent-orange);
}

.status-canceled {
  background-color: var(--accent-red-light);
  color: var(--accent-red);
}

.detail-dates {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 20px;
}

.detail-section {
  margin-bottom: 20px;
}

.detail-section h4 {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-primary);
  margin: 0 0 10px 0;
  font-size: 15px;
}

.section-count {
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: 11px;
  background-color: var(--accent-gray-light);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.section-empty {
  font-size: 13px;
  color: var(--text-muted);
  font-style: italic;
  padding: 10px;
  background-color: var(--bg-tertiary);
  border-radius: 6px;
}

.detail-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.detail-table th {
  text-align: left;
  padding: 8px 10px;
  color: var(--text-secondary);
  font-weight: 600;
  font-size: 12px;
  border-bottom: 2px solid var(--border-color);
  white-space: nowrap;
}

.detail-table td {
  padding: 8px 10px;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
  vertical-align: top;
}

.detail-table tr:last-child td {
  border-bottom: none;
}

.cell-name {
  font-weight: 500;
  word-break: break-word;
}

.cell-description {
  color: var(--text-secondary);
  max-width: 220px;
  word-break: break-word;
}

.detail-loading {
  text-align: center;
  padding: 40px;
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

.detail-error {
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

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 10px;
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
  transition: background-color 0.2s ease;
}

.cancel-btn:hover {
  background-color: var(--border-color);
}
</style>
