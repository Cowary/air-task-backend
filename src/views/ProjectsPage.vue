<template>
  <div class="container">
    <!-- Кнопка возврата на главную -->
    <router-link to="/" class="back-button">← На главную</router-link>

    <!-- Заголовок страницы -->
    <h1>📁 Проекты</h1>
    <p class="subtitle">Управление проектами, еженедельными задачами и задачами</p>

    <!-- Состояние загрузки -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Загрузка проектов...</p>
    </div>

    <!-- Состояние ошибки -->
    <div v-else-if="error" class="error-message">
      <p>❌ {{ error }}</p>
      <button @click="loadProjects" class="retry-btn">Повторить</button>
    </div>

    <div v-else class="content">
      <!-- Панель управления -->
      <div class="toolbar">
        <div class="filter-group">
          <input
            v-model.trim="searchQuery"
            type="text"
            class="search-input"
            placeholder="🔍 Поиск по названию..."
          />

          <label for="filterStatus">Статус:</label>
          <select id="filterStatus" v-model="filterStatus">
            <option value="">Все статусы</option>
            <option value="ACTIVE">Активный</option>
            <option value="COMPLETED">Завершён</option>
            <option value="ARCHIVED">Архивирован</option>
          </select>

          <label for="filterPriority">Приоритет:</label>
          <select id="filterPriority" v-model="filterPriority">
            <option value="">Все приоритеты</option>
            <option value="HIGH">Высокий</option>
            <option value="MIDDLE">Средний</option>
            <option value="LOW">Низкий</option>
          </select>
        </div>

        <button @click="openCreateModal" class="create-btn">+ Создать проект</button>
      </div>

      <!-- Пустое состояние -->
      <div v-if="filteredProjects.length === 0" class="empty-message">
        <p>{{ projects.length === 0 ? 'Нет проектов. Создайте первый проект!' : 'Нет проектов, соответствующих фильтрам' }}</p>
      </div>

      <!-- Список проектов -->
      <div v-else class="project-grid">
        <div
          v-for="project in filteredProjects"
          :key="project.id"
          class="project-card"
          @click="openDetailModal(project)"
          title="Нажмите, чтобы посмотреть подробности"
        >
          <div class="project-card-header">
            <div class="project-name">{{ project.name }}</div>
            <div class="project-badges">
              <span class="badge status-badge" :class="`status-${(project.status || '').toLowerCase()}`">
                {{ getStatusLabel(project.status) }}
              </span>
              <span class="badge priority-badge" :class="`priority-${(project.priority || '').toLowerCase()}`">
                {{ getPriorityLabel(project.priority) }}
              </span>
            </div>
          </div>

          <div class="project-counters">
            <div class="counter-chip weekly-chip">
              <span class="counter-value">{{ project.weeklyList?.length || 0 }}</span>
              <span class="counter-label">еженедельных</span>
            </div>
            <div class="counter-chip task-chip">
              <span class="counter-value">{{ project.taskList?.length || 0 }}</span>
              <span class="counter-label">задач</span>
            </div>
            <div class="counter-chip goal-chip" v-if="(project.goalList?.length || 0) > 0">
              <span class="counter-value">{{ completedGoalsCount(project) }}/{{ project.goalList.length }}</span>
              <span class="counter-label">целей</span>
            </div>
          </div>

          <div class="project-preview" v-if="hasLinkedItems(project)">
            <span v-for="weekly in (project.weeklyList || []).slice(0, 2)" :key="'w' + weekly.id" class="preview-tag">
              📊 {{ weekly.name }}
            </span>
            <span v-for="task in (project.taskList || []).slice(0, 2)" :key="'t' + task.id" class="preview-tag">
              📝 {{ task.name }}
              <span
                v-if="task.subTasks?.length"
                class="tag-subtasks"
                :class="{ 'tag-subtasks-done': task.subTasks.every(s => s.isCompleted) }"
              >
                ✓ {{ task.subTasks.filter(s => s.isCompleted).length }}/{{ task.subTasks.length }}
              </span>
            </span>
            <span
              v-for="goal in (project.goalList || []).slice(0, 2)"
              :key="'g' + goal.id"
              class="preview-tag goal-preview-tag"
              :class="{ 'goal-completed': goal.isCompleted }"
            >
              🎯 {{ goal.name }}
            </span>
            <span v-if="hiddenCount(project) > 0" class="preview-tag more-tag">
              +{{ hiddenCount(project) }} ещё
            </span>
          </div>
          <div class="project-preview empty-preview" v-else>
            Задачи и цели не привязаны
          </div>

          <div class="project-footer">
            <span class="project-date">Создан: {{ formatDate(project.createdTs) }}</span>
            <div class="project-actions" @click.stop>
              <button @click="openEditModal(project)" class="action-btn edit-btn" title="Редактировать">✏️</button>
              <button @click="confirmDelete(project)" class="action-btn delete-btn" title="Удалить">🗑️</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно создания/редактирования -->
    <ProjectFormModal
      :visible="showFormModal"
      :project="editingProject"
      @close="closeFormModal"
      @saved="handleSaved"
    />

    <!-- Модальное окно детальной информации -->
    <ProjectDetailModal
      :visible="showDetailModal"
      :project-id="detailProjectId"
      @close="closeDetailModal"
    />

    <!-- Модальное окно подтверждения удаления -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
      <div class="modal-content modal-small" @click.stop>
        <h3>Подтверждение удаления</h3>
        <p>
          Вы уверены, что хотите удалить проект "{{ projectToDelete?.name }}"?
          Привязанные задачи останутся в системе.
        </p>
        <div class="form-actions">
          <button @click="closeDeleteModal" class="cancel-btn">Отмена</button>
          <button @click="removeProject" class="delete-btn-confirm" :disabled="deleting">
            {{ deleting ? 'Удаление...' : 'Удалить' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getAllProjects, deleteProject } from '../api/projects.js';
import ProjectFormModal from '../components/ProjectFormModal.vue';
import ProjectDetailModal from '../components/ProjectDetailModal.vue';

export default {
  name: 'ProjectsPage',

  components: {
    ProjectFormModal,
    ProjectDetailModal
  },

  data() {
    return {
      projects: [],
      loading: false,
      error: null,

      // Фильтры
      searchQuery: '',
      filterStatus: '',
      filterPriority: '',

      // Форма создания/редактирования
      showFormModal: false,
      editingProject: null,

      // Детальное окно
      showDetailModal: false,
      detailProjectId: null,

      // Удаление
      showDeleteModal: false,
      projectToDelete: null,
      deleting: false
    };
  },

  computed: {
    filteredProjects() {
      return this.projects.filter(project => {
        if (this.searchQuery && !project.name?.toLowerCase().includes(this.searchQuery.toLowerCase())) {
          return false;
        }
        if (this.filterStatus && project.status !== this.filterStatus) {
          return false;
        }
        if (this.filterPriority && project.priority !== this.filterPriority) {
          return false;
        }
        return true;
      });
    }
  },

  methods: {
    async loadProjects() {
      this.loading = true;
      this.error = null;

      try {
        const response = await getAllProjects();

        if (response.isSuccess) {
          this.projects = response.data?.projects || [];
        } else {
          this.error = response.errorMessage || 'Не удалось загрузить проекты';
        }
      } catch (err) {
        this.error = 'Не удалось загрузить список проектов. Проверьте, запущен ли сервер.';
        console.error('Ошибка загрузки проектов:', err);
      } finally {
        this.loading = false;
      }
    },

    getStatusLabel(status) {
      const labels = {
        'ACTIVE': 'Активный',
        'COMPLETED': 'Завершён',
        'ARCHIVED': 'Архивирован'
      };
      return labels[status] || status || '—';
    },

    getPriorityLabel(priority) {
      const labels = {
        'HIGH': 'Высокий',
        'MIDDLE': 'Средний',
        'MEDIUM': 'Средний',
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
        year: 'numeric'
      });
    },

    hasLinkedItems(project) {
      return (project.weeklyList?.length || 0) > 0
        || (project.taskList?.length || 0) > 0
        || (project.goalList?.length || 0) > 0;
    },

    completedGoalsCount(project) {
      return (project.goalList || []).filter(g => g.isCompleted).length;
    },

    hiddenCount(project) {
      const total = (project.weeklyList?.length || 0)
        + (project.taskList?.length || 0)
        + (project.goalList?.length || 0);
      return Math.max(0, total - 6);
    },

    openCreateModal() {
      this.editingProject = null;
      this.showFormModal = true;
    },

    openEditModal(project) {
      this.editingProject = project;
      this.showFormModal = true;
    },

    closeFormModal() {
      this.showFormModal = false;
      this.editingProject = null;
    },

    async handleSaved() {
      await this.loadProjects();
    },

    openDetailModal(project) {
      this.detailProjectId = project.id;
      this.showDetailModal = true;
    },

    closeDetailModal() {
      this.showDetailModal = false;
      this.detailProjectId = null;
    },

    confirmDelete(project) {
      this.projectToDelete = project;
      this.showDeleteModal = true;
    },

    closeDeleteModal() {
      this.showDeleteModal = false;
      this.projectToDelete = null;
    },

    async removeProject() {
      if (!this.projectToDelete) {
        return;
      }

      this.deleting = true;

      try {
        const response = await deleteProject(this.projectToDelete.id);

        if (response.isSuccess) {
          this.closeDeleteModal();
          await this.loadProjects();
        } else {
          alert('Не удалось удалить проект: ' + (response.errorMessage || 'Неизвестная ошибка'));
        }
      } catch (err) {
        alert('Ошибка при удалении проекта');
        console.error('Ошибка удаления проекта:', err);
      } finally {
        this.deleting = false;
      }
    }
  },

  mounted() {
    this.loadProjects();
  }
};
</script>

<style scoped>
.container {
  max-width: 1100px;
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

.search-input {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 5px;
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  font-size: 14px;
  min-width: 200px;
}

.search-input:focus {
  outline: none;
  border-color: var(--accent-primary);
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

/* Сетка проектов */
.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 15px;
}

.project-card {
  padding: 20px;
  border-radius: 10px;
  background-color: var(--bg-secondary);
  border: 2px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.project-card:hover {
  box-shadow: 0 4px 14px var(--shadow-color);
  border-color: var(--accent-primary);
  transform: translateY(-2px);
}

.project-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}

.project-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  word-break: break-word;
}

.project-badges {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.badge {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 12px;
  font-weight: 500;
  white-space: nowrap;
}

/* Приоритеты */
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

/* Статусы */
.status-active {
  background-color: var(--accent-blue-light);
  color: var(--accent-blue);
}

.status-completed {
  background-color: var(--accent-green-light);
  color: var(--accent-green);
}

.status-archived {
  background-color: var(--accent-gray-light);
  color: var(--accent-gray);
}

/* Счётчики */
.project-counters {
  display: flex;
  gap: 10px;
}

.counter-chip {
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  background-color: var(--bg-tertiary);
}

.counter-value {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.counter-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.weekly-chip {
  border-left: 3px solid var(--accent-blue);
}

.task-chip {
  border-left: 3px solid var(--accent-purple);
}

.goal-chip {
  border-left: 3px solid var(--accent-green);
}

/* Превью привязанных задач */
.project-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.preview-tag {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 10px;
  background-color: var(--bg-tertiary);
  color: var(--text-secondary);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.more-tag {
  color: var(--accent-primary);
  font-weight: 600;
}

.tag-subtasks {
  font-weight: 600;
  color: var(--text-muted);
  margin-left: 6px;
}

.tag-subtasks-done {
  color: var(--accent-green);
}

.goal-preview-tag.goal-completed {
  text-decoration: line-through;
  opacity: 0.7;
}

.empty-preview {
  font-style: italic;
  color: var(--text-muted);
}

/* Футер карточки */
.project-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}

.project-date {
  font-size: 12px;
  color: var(--text-muted);
}

.project-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background-color: var(--bg-tertiary);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
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

/* Модальные окна */
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

  .search-input {
    min-width: 0;
  }
}
</style>
