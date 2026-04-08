<template>
  <div class="container">
    <!-- Кнопка возврата на главную -->
    <router-link to="/" class="back-button">← На главную</router-link>

    <!-- Заголовок страницы -->
    <h1>📝 Управление задачами</h1>
    <p class="subtitle">Создание, редактирование и удаление задач</p>

    <!-- Состояние загрузки -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Загрузка задач...</p>
    </div>

    <!-- Состояние ошибки -->
    <div v-else-if="error" class="error-message">
      <p>❌ {{ error }}</p>
      <button @click="loadTasks" class="retry-btn">Повторить</button>
    </div>

    <!-- Основной контент -->
    <div v-else class="content">
      <!-- Панель управления -->
      <div class="toolbar">
        <div class="filter-group">
          <label for="filterProject">Проект:</label>
          <select id="filterProject" v-model="filterProject">
            <option value="">Все проекты</option>
            <option v-for="project in uniqueProjects" :key="project" :value="project">
              {{ project }}
            </option>
          </select>

          <label for="filterStatus">Статус:</label>
          <select id="filterStatus" v-model="filterStatus">
            <option value="">Все статусы</option>
            <option value="IN_PROGRESS">В работе</option>
            <option value="DONE">Выполнено</option>
            <option value="PAUSED">На паузе</option>
          </select>

          <label for="filterPriority">Приоритет:</label>
          <select id="filterPriority" v-model="filterPriority">
            <option value="">Все приоритеты</option>
            <option value="HIGH">Высокий</option>
            <option value="MIDDLE">Средний</option>
            <option value="LOW">Низкий</option>
          </select>
        </div>

        <button @click="openCreateModal" class="create-btn">+ Создать задачу</button>
      </div>

      <!-- Пустое состояние -->
      <div v-if="filteredTasks.length === 0" class="empty-message">
        <p>{{ tasks.length === 0 ? 'Нет задач. Создайте первую задачу!' : 'Нет задач, соответствующих фильтрам' }}</p>
      </div>

      <!-- Список задач -->
      <div v-else class="task-list">
        <div v-for="task in filteredTasks" :key="task.id" class="task-card">
          <div class="task-info">
            <div class="task-header">
              <div class="task-project" v-if="task.project?.name">
                📁 {{ task.project.name }}
              </div>
              <span class="task-priority" :class="`priority-${task.priority.toLowerCase()}`">
                {{ getPriorityLabel(task.priority) }}
              </span>
            </div>

            <div class="task-name">{{ task.name }}</div>

            <div v-if="task.description" class="task-description">
              {{ task.description }}
            </div>

            <div class="task-meta">
              <span class="task-status" :class="`status-${task.status.toLowerCase().replace(' ', '_')}`">
                {{ getStatusLabel(task.status) }}
              </span>
              <span class="task-date">
                Создано: {{ formatDate(task.createdTs) }}
              </span>
            </div>
          </div>

          <div class="task-actions">
            <button @click="openEditModal(task)" class="action-btn edit-btn" title="Редактировать">✏️</button>
            <button @click="confirmDelete(task)" class="action-btn delete-btn" title="Удалить">🗑️</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно для создания/редактирования задачи -->
    <div v-if="showTaskModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <h3>{{ editingTask ? 'Редактировать задачу' : 'Создать новую задачу' }}</h3>

        <form @submit.prevent="saveTask" class="task-form">
          <div class="form-group">
            <label for="taskName">Название задачи *</label>
            <input
              id="taskName"
              v-model.trim="taskForm.name"
              type="text"
              required
              maxlength="200"
              placeholder="Введите название задачи"
            />
          </div>

          <div class="form-group">
            <label for="taskProject">Проект *</label>
            <select
              id="taskProject"
              v-model="taskForm.projectName"
              required
              :disabled="loadingProjects || projects.length === 0"
            >
              <option value="" disabled v-if="!taskForm.projectName">Загрузка проектов...</option>
              <option
                v-for="project in projects"
                :key="project.id"
                :value="project.name"
              >
                {{ project.name }}
              </option>
            </select>
            <span v-if="loadingProjects" class="form-hint">Загрузка проектов...</span>
            <span v-else-if="projects.length === 0" class="form-hint">Нет доступных проектов</span>
          </div>

          <div class="form-group">
            <label for="taskPriority">Приоритет *</label>
            <select
              id="taskPriority"
              v-model="taskForm.priority"
              required
            >
              <option value="HIGH">Высокий</option>
              <option value="MIDDLE">Средний</option>
              <option value="LOW">Низкий</option>
            </select>
          </div>

          <div class="form-group">
            <label for="taskStatus">Статус *</label>
            <select
              id="taskStatus"
              v-model="taskForm.status"
              required
            >
              <option value="IN_PROGRESS">В работе</option>
              <option value="DONE">Выполнено</option>
              <option value="PAUSED">На паузе</option>
            </select>
          </div>

          <div class="form-group">
            <label for="taskDescription">Описание</label>
            <textarea
              id="taskDescription"
              v-model="taskForm.description"
              placeholder="Введите описание задачи (опционально)"
              maxlength="10000"
              rows="4"
            ></textarea>
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
        <p>Вы уверены, что хотите удалить задачу "{{ taskToDelete?.name }}"?</p>
        <div class="form-actions">
          <button @click="closeDeleteModal" class="cancel-btn">Отмена</button>
          <button @click="deleteTask" class="delete-btn-confirm" :disabled="deleting">
            {{ deleting ? 'Удаление...' : 'Удалить' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getTasks, createTask, updateTask, deleteTask, getAllProjects } from '../api/tasks.js';

export default {
  name: 'TasksPage',

  data() {
    return {
      tasks: [],
      loading: false,
      error: null,

      // Проекты
      projects: [],
      loadingProjects: false,

      // Фильтры
      filterProject: '',
      filterStatus: '',
      filterPriority: '',

      // Модальное окно задачи
      showTaskModal: false,
      editingTask: null,
      saving: false,
      taskForm: {
        name: '',
        projectName: '',
        priority: 'MIDDLE',
        status: 'IN_PROGRESS',
        description: ''
      },

      // Модальное окно удаления
      showDeleteModal: false,
      taskToDelete: null,
      deleting: false
    };
  },

  computed: {
    uniqueProjects() {
      const projects = new Set();
      this.tasks.forEach(task => {
        if (task.project?.name) {
          projects.add(task.project.name);
        }
      });
      return Array.from(projects).sort();
    },

    filteredTasks() {
      return this.tasks.filter(task => {
        if (this.filterProject && task.project?.name !== this.filterProject) {
          return false;
        }
        if (this.filterStatus && task.status !== this.filterStatus) {
          return false;
        }
        if (this.filterPriority && task.priority !== this.filterPriority) {
          return false;
        }
        return true;
      });
    }
  },

  methods: {
    async loadTasks() {
      this.loading = true;
      this.error = null;

      try {
        const response = await getTasks();

        if (response.isSuccess) {
          this.tasks = response.data || [];
        } else {
          this.error = response.errorMessage || 'Неизвестная ошибка';
        }
      } catch (err) {
        this.error = 'Не удалось загрузить список задач. Проверьте, запущен ли сервер.';
        console.error('Ошибка загрузки задач:', err);
      } finally {
        this.loading = false;
      }
    },

    async loadProjects() {
      this.loadingProjects = true;

      try {
        const response = await getAllProjects();

        if (response.isSuccess) {
          this.projects = response.data?.projects || [];
        }
      } catch (err) {
        console.error('Ошибка загрузки проектов:', err);
      } finally {
        this.loadingProjects = false;
      }
    },

    getPriorityLabel(priority) {
      const labels = {
        'HIGH': 'Высокий',
        'MIDDLE': 'Средний',
        'LOW': 'Низкий'
      };
      return labels[priority] || priority;
    },

    getStatusLabel(status) {
      const labels = {
        'IN_PROGRESS': 'В работе',
        'DONE': 'Выполнено',
        'PAUSED': 'На паузе'
      };
      return labels[status] || status;
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
      this.editingTask = null;
      this.taskForm = {
        name: '',
        projectName: this.projects.length > 0 ? this.projects[0].name : '',
        priority: 'MIDDLE',
        status: 'IN_PROGRESS',
        description: ''
      };
      this.showTaskModal = true;
    },

    openEditModal(task) {
      this.editingTask = task;
      this.taskForm = {
        name: task.name,
        projectName: task.project?.name || '',
        priority: task.priority,
        status: task.status,
        description: task.description || ''
      };
      this.showTaskModal = true;
    },

    closeModal() {
      this.showTaskModal = false;
      this.editingTask = null;
      this.taskForm = {
        name: '',
        projectName: this.projects.length > 0 ? this.projects[0].name : '',
        priority: 'MIDDLE',
        status: 'IN_PROGRESS',
        description: ''
      };
    },

    async saveTask() {
      if (!this.taskForm.name || !this.taskForm.projectName) {
        alert('Пожалуйста, заполните все обязательные поля');
        return;
      }

      this.saving = true;

      try {
        let response;

        if (this.editingTask) {
          response = await updateTask({
            id: this.editingTask.id,
            name: this.taskForm.name,
            projectName: this.taskForm.projectName,
            priority: this.taskForm.priority,
            status: this.taskForm.status,
            description: this.taskForm.description
          });
        } else {
          response = await createTask({
            name: this.taskForm.name,
            projectName: this.taskForm.projectName,
            priority: this.taskForm.priority,
            status: this.taskForm.status,
            description: this.taskForm.description
          });
        }

        if (response.isSuccess) {
          this.closeModal();
          await this.loadTasks();
        } else {
          alert('Не удалось сохранить задачу: ' + (response.errorMessage || 'Неизвестная ошибка'));
        }
      } catch (err) {
        alert('Ошибка при сохранении задачи');
        console.error('Ошибка сохранения:', err);
      } finally {
        this.saving = false;
      }
    },

    confirmDelete(task) {
      this.taskToDelete = task;
      this.showDeleteModal = true;
    },

    closeDeleteModal() {
      this.showDeleteModal = false;
      this.taskToDelete = null;
    },

    async deleteTask() {
      if (!this.taskToDelete) {
        return;
      }

      this.deleting = true;

      try {
        const response = await deleteTask(this.taskToDelete.id);

        if (response.isSuccess) {
          this.closeDeleteModal();
          await this.loadTasks();
        } else {
          alert('Не удалось удалить задачу: ' + (response.errorMessage || 'Неизвестная ошибка'));
        }
      } catch (err) {
        alert('Ошибка при удалении задачи');
        console.error('Ошибка удаления:', err);
      } finally {
        this.deleting = false;
      }
    }
  },

  mounted() {
    this.loadTasks();
    this.loadProjects();
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
  margin-bottom: 30px;
}

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

/* Панель управления */
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

/* Пустое состояние */
.empty-message {
  text-align: center;
  padding: 40px;
  color: var(--text-muted);
  background-color: var(--bg-tertiary);
  border-radius: 8px;
}

/* Список задач */
.task-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

/* Карточка задачи */
.task-card {
  padding: 20px;
  border-radius: 8px;
  background-color: var(--bg-secondary);
  border: 2px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  transition: all 0.2s ease;
}

.task-card:hover {
  box-shadow: 0 2px 8px var(--shadow-color);
  border-color: var(--accent-primary);
}

.task-info {
  flex: 1;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.task-project {
  font-size: 12px;
  color: var(--text-secondary);
}

.task-name {
  font-size: 18px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 10px;
}

.task-description {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 10px;
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
}

/* Приоритеты */
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

/* Статусы */
.status-in_progress {
  background-color: var(--accent-blue-light);
  color: var(--accent-blue);
}

.status-done {
  background-color: var(--accent-green-light);
  color: var(--accent-green);
}

.status-paused {
  background-color: var(--accent-red-light);
  color: var(--accent-red);
}

.task-date {
  font-size: 12px;
  color: var(--text-muted);
}

/* Кнопки действий */
.task-actions {
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

/* Модальное окно */
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

/* Форма */
.task-form {
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
.form-group select,
.form-group textarea {
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: 5px;
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  font-size: 14px;
  font-family: inherit;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.form-hint {
  font-size: 12px;
  color: var(--text-muted);
  font-style: italic;
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

/* Адаптивность */
@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-group {
    flex-direction: column;
    align-items: stretch;
  }

  .task-card {
    flex-direction: column;
  }

  .task-actions {
    margin-left: 0;
    margin-top: 15px;
    justify-content: flex-end;
  }
}
</style>
