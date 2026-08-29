<template>
  <div class="task-list-section">
    <!-- Панель управления -->
    <div class="section-toolbar">
      <div class="view-toggle">
        <button
          class="view-btn"
          :class="{ active: viewMode === 'list' }"
          @click="viewMode = 'list'"
          title="Список"
        >
          📋 Список
        </button>
        <button
          class="view-btn"
          :class="{ active: viewMode === 'kanban' }"
          @click="viewMode = 'kanban'"
          title="Канбан"
        >
          📊 Канбан
        </button>
      </div>

      <div v-if="showFilters" class="filter-group">
        <select v-model="filterProject" class="filter-select" title="Проект">
          <option value="">Все проекты</option>
          <option v-for="name in uniqueProjects" :key="name" :value="name">
            {{ name }}
          </option>
        </select>

        <select v-model="filterStatus" class="filter-select" title="Статус">
          <option value="">Все статусы</option>
          <option value="IDEA">Идея</option>
          <option value="BACKLOG">Бэклог</option>
          <option value="IN_PROGRESS">В работе</option>
          <option value="DONE">Выполнено</option>
          <option value="PAUSED">На паузе</option>
          <option value="CANCELED">Отменено</option>
        </select>

        <select v-model="filterPriority" class="filter-select" title="Приоритет">
          <option value="">Все приоритеты</option>
          <option value="HIGH">Высокий</option>
          <option value="MIDDLE">Средний</option>
          <option value="LOW">Низкий</option>
        </select>
      </div>

      <button @click="openCreateModal" class="create-btn">+ Задача</button>
    </div>

    <!-- Канбан -->
    <KanbanBoard
      v-if="viewMode === 'kanban'"
      :tasks="filteredTasks"
      :show-toolbar="false"
      @update-status="handleKanbanUpdate"
      @edit-task="openEditModal"
      @create-task="openCreateModal"
    />

    <!-- Список -->
    <template v-else>
      <div v-if="filteredTasks.length === 0" class="empty-message">
        <p>{{ tasks.length === 0 ? (emptyText || 'Задач пока нет. Создайте первую!') : 'Нет задач, соответствующих фильтрам' }}</p>
      </div>

      <div v-else class="task-list">
        <div v-for="task in filteredTasks" :key="task.id" class="task-card">
          <div class="task-info">
            <div class="task-header">
              <span class="task-project" v-if="showProjectName && task.project?.name">
                📁 {{ task.project.name }}
              </span>
              <span class="task-priority" :class="`priority-${task.priority.toLowerCase()}`">
                {{ getPriorityLabel(task.priority) }}
              </span>
            </div>

            <div class="task-name">{{ task.name }}</div>

            <div v-if="task.description" class="task-description">
              {{ task.description }}
            </div>

            <div class="task-meta">
              <span class="task-status" :class="`status-${task.status.toLowerCase()}`">
                {{ getStatusLabel(task.status) }}
              </span>
              <span class="task-date">Создано: {{ formatDate(task.createdTs) }}</span>
            </div>
          </div>

          <div class="task-actions">
            <button @click="openEditModal(task)" class="action-btn edit-btn" title="Редактировать">✏️</button>
            <button @click="confirmDelete(task)" class="action-btn delete-btn" title="Удалить">🗑️</button>
          </div>
        </div>
      </div>
    </template>

    <!-- Модальное окно создания/редактирования -->
    <TaskFormModal
      :visible="showTaskModal"
      :task="editingTask"
      :projects="projects"
      :default-project-name="defaultProjectName"
      @close="closeTaskModal"
      @saved="handleTaskSaved"
    />

    <!-- Модальное окно подтверждения удаления -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
      <div class="modal-content modal-small" @click.stop>
        <h3>Подтверждение удаления</h3>
        <p>Вы уверены, что хотите удалить задачу "{{ taskToDelete?.name }}"?</p>
        <div class="form-actions">
          <button @click="closeDeleteModal" class="cancel-btn">Отмена</button>
          <button @click="removeTask" class="delete-btn-confirm" :disabled="deleting">
            {{ deleting ? 'Удаление...' : 'Удалить' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import KanbanBoard from '../KanbanBoard.vue';
import TaskFormModal from './TaskFormModal.vue';
import { deleteTask, updateTask } from '../../api/tasks.js';

export default {
  name: 'TaskListSection',

  components: {
    KanbanBoard,
    TaskFormModal
  },

  props: {
    tasks: {
      type: Array,
      default: () => []
    },
    projects: {
      type: Array,
      default: () => []
    },
    defaultProjectName: {
      type: String,
      default: ''
    },
    showFilters: {
      type: Boolean,
      default: false
    },
    showProjectName: {
      type: Boolean,
      default: true
    },
    emptyText: {
      type: String,
      default: ''
    }
  },

  emits: ['changed'],

  data() {
    return {
      viewMode: 'list',
      filterProject: '',
      filterStatus: '',
      filterPriority: '',

      showTaskModal: false,
      editingTask: null,

      // Локальные оптимистичные изменения статуса (id -> статус)
      statusOverrides: {},

      showDeleteModal: false,
      taskToDelete: null,
      deleting: false
    };
  },

  computed: {
    uniqueProjects() {
      const names = new Set();
      this.tasks.forEach(task => {
        if (task.project?.name) {
          names.add(task.project.name);
        }
      });
      return Array.from(names).sort();
    },

    tasksWithOverrides() {
      return this.tasks.map(task =>
        this.statusOverrides[task.id]
          ? { ...task, status: this.statusOverrides[task.id] }
          : task
      );
    },

    filteredTasks() {
      return this.tasksWithOverrides.filter(task => {
        if (this.showFilters) {
          if (this.filterProject && task.project?.name !== this.filterProject) {
            return false;
          }
          if (this.filterStatus && task.status !== this.filterStatus) {
            return false;
          }
          if (this.filterPriority && task.priority !== this.filterPriority) {
            return false;
          }
        }
        return true;
      });
    }
  },

  methods: {
    getPriorityLabel(priority) {
      const labels = {
        'HIGH': 'Высокий',
        'MIDDLE': 'Средний',
        'MEDIUM': 'Средний',
        'LOW': 'Низкий'
      };
      return labels[priority] || priority;
    },

    getStatusLabel(status) {
      const labels = {
        'IDEA': 'Идея',
        'BACKLOG': 'Бэклог',
        'IN_PROGRESS': 'В работе',
        'DONE': 'Выполнено',
        'PAUSED': 'На паузе',
        'CANCELED': 'Отменено'
      };
      return labels[status] || status;
    },

    formatDate(dateString) {
      if (!dateString) return '—';
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    },

    openCreateModal() {
      this.editingTask = null;
      this.showTaskModal = true;
    },

    openEditModal(task) {
      this.editingTask = task;
      this.showTaskModal = true;
    },

    closeTaskModal() {
      this.showTaskModal = false;
      this.editingTask = null;
    },

    handleTaskSaved() {
      this.$emit('changed');
    },

    confirmDelete(task) {
      this.taskToDelete = task;
      this.showDeleteModal = true;
    },

    closeDeleteModal() {
      this.showDeleteModal = false;
      this.taskToDelete = null;
    },

    async removeTask() {
      if (!this.taskToDelete) {
        return;
      }

      this.deleting = true;

      try {
        const response = await deleteTask(this.taskToDelete.id);

        if (response.isSuccess) {
          this.closeDeleteModal();
          this.$emit('changed');
        } else {
          alert('Не удалось удалить задачу: ' + (response.errorMessage || 'Неизвестная ошибка'));
        }
      } catch (err) {
        alert('Ошибка при удалении задачи');
        console.error('Ошибка удаления задачи:', err);
      } finally {
        this.deleting = false;
      }
    },

    async handleKanbanUpdate({ taskId, newStatus }) {
      const task = this.tasksWithOverrides.find(t => t.id === taskId);
      if (!task) {
        return;
      }

      // Оптимистичное обновление статуса через локальный override
      this.statusOverrides = { ...this.statusOverrides, [taskId]: newStatus };

      try {
        const response = await updateTask({
          id: taskId,
          name: task.name,
          projectName: task.project?.name || '',
          priority: task.priority,
          status: newStatus,
          description: task.description || ''
        });

        if (response.isSuccess) {
          this.statusOverrides = {};
          this.$emit('changed');
        } else {
          this.rollbackStatus(taskId);
          alert('Не удалось обновить статус: ' + (response.errorMessage || 'Неизвестная ошибка'));
        }
      } catch (err) {
        this.rollbackStatus(taskId);
        alert('Ошибка при обновлении статуса');
        console.error('Ошибка обновления статуса задачи:', err);
      }
    },

    rollbackStatus(taskId) {
      const overrides = { ...this.statusOverrides };
      delete overrides[taskId];
      this.statusOverrides = overrides;
      this.$emit('changed');
    }
  }
};
</script>

<style scoped>
.section-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 15px;
  padding: 12px 15px;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.view-toggle {
  display: flex;
  gap: 4px;
  padding: 3px;
  background-color: var(--bg-tertiary);
  border-radius: 8px;
}

.view-btn {
  padding: 7px 14px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.view-btn:hover {
  color: var(--text-primary);
}

.view-btn.active {
  background-color: var(--accent-primary);
  color: white;
}

.filter-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  flex: 1;
}

.filter-select {
  padding: 7px 10px;
  border: 1px solid var(--border-color);
  border-radius: 5px;
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  font-size: 13px;
}

.create-btn {
  margin-left: auto;
  padding: 8px 16px;
  background-color: var(--accent-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
  white-space: nowrap;
}

.create-btn:hover {
  background-color: #5a6fd6;
}

.empty-message {
  text-align: center;
  padding: 30px;
  color: var(--text-muted);
  background-color: var(--bg-tertiary);
  border-radius: 8px;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-card {
  padding: 16px;
  border-radius: 8px;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.task-card:hover {
  box-shadow: 0 2px 8px var(--shadow-color);
  border-color: var(--accent-primary);
}

.task-info {
  flex: 1;
  min-width: 0;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.task-project {
  font-size: 12px;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-name {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 8px;
  word-break: break-word;
}

.task-description {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 8px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.task-meta {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.task-priority,
.task-status {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 12px;
  font-weight: 500;
  white-space: nowrap;
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

.status-idea {
  background-color: var(--accent-purple-light);
  color: var(--accent-purple);
}

.status-backlog {
  background-color: var(--accent-gray-light);
  color: var(--accent-gray);
}

.status-in_progress {
  background-color: var(--accent-blue-light);
  color: var(--accent-blue);
}

.status-done {
  background-color: var(--accent-green-light);
  color: var(--accent-green);
}

.status-paused {
  background-color: var(--accent-orange-light);
  color: var(--accent-orange);
}

.status-canceled {
  background-color: var(--accent-red-light);
  color: var(--accent-red);
}

.task-date {
  font-size: 12px;
  color: var(--text-muted);
}

.task-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.action-btn {
  width: 34px;
  height: 34px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background-color: var(--bg-tertiary);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 15px;
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
  max-width: 400px;
  width: 90%;
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
  margin-bottom: 15px;
  text-align: center;
}

.modal-content p {
  color: var(--text-secondary);
  margin-bottom: 20px;
  text-align: center;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.cancel-btn,
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

@media (max-width: 768px) {
  .section-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .create-btn {
    margin-left: 0;
  }

  .task-card {
    flex-direction: column;
  }
}
</style>
