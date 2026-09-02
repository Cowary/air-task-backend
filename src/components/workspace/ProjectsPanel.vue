<template>
  <div class="projects-panel">
    <!-- Левая колонка: список проектов -->
    <aside class="projects-sidebar">
      <div class="sidebar-toolbar">
        <input
          v-model.trim="searchQuery"
          type="text"
          class="search-input"
          placeholder="🔍 Поиск..."
        />
        <button @click="openCreateProject" class="create-project-btn">+ Проект</button>
      </div>

      <div class="sidebar-filters">
        <select v-model="statusFilter" class="filter-select" @change="applyStatusFilter">
          <option value="ACTIVE">Активные</option>
          <option value="ALL">Все статусы</option>
          <option value="DONE">Завершённые</option>
          <option value="ARCHIVED">Архивированные</option>
        </select>
        <select v-model="filterPriority" class="filter-select">
          <option value="">Все приоритеты</option>
          <option value="HIGH">Высокий</option>
          <option value="MIDDLE">Средний</option>
          <option value="LOW">Низкий</option>
        </select>
      </div>

      <div class="project-cards">
        <div v-if="filteredProjects.length === 0 && orphanTasks.length + archivedOrphanTasks.length === 0" class="sidebar-empty">
          <p>{{ projects.length === 0 ? 'Нет проектов. Создайте первый!' : 'Ничего не найдено' }}</p>
        </div>

        <!-- Карточка проекта -->
        <div
          v-for="project in filteredProjects"
          :key="project.id"
          class="project-card"
          :class="{ selected: selectedKey === project.id }"
          @click="select(project.id)"
        >
          <div class="card-title-row">
            <span class="card-name">{{ project.name }}</span>
            <span
              class="badge priority-badge"
              :class="`priority-${(project.priority || '').toLowerCase()}`"
            >
              {{ getPriorityLabel(project.priority) }}
            </span>
          </div>

          <div class="card-badges">
            <span class="badge status-badge" :class="`status-${(project.status || '').toLowerCase()}`">
              {{ getProjectStatusLabel(project.status) }}
            </span>
          </div>

          <div v-if="(project.goalList?.length || 0) > 0" class="card-goals">
            <div class="card-goals-bar">
              <div class="card-goals-fill" :style="{ width: goalsPercentage(project) }"></div>
            </div>
            <span class="card-goals-text">🎯 {{ completedGoalsCount(project) }}/{{ project.goalList.length }}</span>
          </div>

          <div class="card-counters">
            <span class="counter counter-weekly" title="Еженедельные задачи">
              📊 {{ project.weeklyList?.length || 0 }}
            </span>
            <span class="counter counter-tasks" title="Невыполненные задачи">
              📝 {{ activeTasksCount(project) }}
            </span>
          </div>
        </div>

        <!-- Виртуальная карточка «Без проекта» -->
        <div
          v-if="orphanTasks.length + archivedOrphanTasks.length > 0"
          class="project-card orphan-card"
          :class="{ selected: selectedKey === '__none__' }"
          @click="select('__none__')"
        >
          <div class="card-title-row">
            <span class="card-name">Без проекта</span>
          </div>
          <div class="card-counters">
            <span class="counter counter-tasks" title="Задачи вне проектов">
              📝 {{ orphanTasks.length }}
            </span>
          </div>
        </div>
      </div>
    </aside>

    <!-- Правая колонка: детали проекта -->
    <section class="project-detail">
      <!-- Проект выбран -->
      <template v-if="selectedProject">
        <div class="detail-header">
          <div class="detail-title">
            <h2>{{ selectedProject.name }}</h2>
            <div class="detail-badges">
              <span class="badge status-badge" :class="`status-${(selectedProject.status || '').toLowerCase()}`">
                {{ getProjectStatusLabel(selectedProject.status) }}
              </span>
              <span class="badge priority-badge" :class="`priority-${(selectedProject.priority || '').toLowerCase()}`">
                {{ getPriorityLabel(selectedProject.priority) }}
              </span>
            </div>
          </div>

          <div class="detail-actions">
            <button @click="openEditProject(selectedProject)" class="action-btn edit-btn" title="Редактировать проект">✏️</button>
            <button @click="confirmDeleteProject(selectedProject)" class="action-btn delete-btn" title="Удалить проект">🗑️</button>
          </div>
        </div>

        <div class="detail-dates">
          <span>Создан: {{ formatDate(selectedProject.createdTs) }}</span>
          <span>Обновлён: {{ formatDate(selectedProject.updatedTs) }}</span>
        </div>

        <!-- Цели -->
        <div class="detail-section">
          <div class="section-head">
            <h3>🎯 Цели проекта</h3>
            <span class="section-count" :class="{ 'count-done': allGoalsDone }">
              {{ completedGoalsCount(selectedProject) }}/{{ goalList.length }}
            </span>
          </div>

          <div v-if="goalList.length > 0" class="goals-progress">
            <div class="goals-progress-bar">
              <div class="goals-progress-fill" :style="{ width: goalsPercentage(selectedProject) }"></div>
            </div>
          </div>

          <div v-if="goalList.length === 0" class="section-empty">
            Цели не заданы — добавьте их через редактирование проекта (✏️).
          </div>
          <div v-else class="goal-checklist">
            <label v-for="goal in goalList" :key="goal.id" class="goal-check-item">
              <input
                type="checkbox"
                :checked="goal.isCompleted"
                :disabled="togglingGoals.includes(goal.id)"
                @change="toggleGoal(goal, $event)"
              />
              <span class="goal-check-name" :class="{ 'goal-done': goal.isCompleted }">
                {{ goal.name }}
              </span>
            </label>
          </div>
        </div>

        <!-- Еженедельные задачи -->
        <div class="detail-section">
          <div class="section-head">
            <h3>📊 Еженедельные задачи</h3>
            <span class="section-count">{{ weeklyList.length }}</span>
            <button @click="openCreateWeekly" class="section-add-btn">+ Еженедельная</button>
          </div>

          <div v-if="weeklyList.length === 0" class="section-empty">
            Нет еженедельных задач — добавьте их через кнопку выше или редактирование проекта.
          </div>
          <div v-else class="weekly-list">
            <div v-for="weekly in weeklyList" :key="weekly.id" class="weekly-row">
              <div class="weekly-info">
                <div class="weekly-top">
                  <span class="weekly-name">{{ weekly.name }}</span>
                  <span class="weekly-count">{{ weekly.count }} р/нед</span>
                </div>
                <div class="weekly-meta">
                  <span class="badge priority-badge" :class="`priority-${(weekly.priority || '').toLowerCase()}`">
                    {{ getPriorityLabel(weekly.priority) }}
                  </span>
                  <span class="badge status-badge" :class="`status-${(weekly.status || '').toLowerCase()}`">
                    {{ getTaskStatusLabel(weekly.status) }}
                  </span>
                </div>
                <div v-if="weeklyStats(weekly)" class="weekly-progress">
                  <div class="progress-bar">
                    <div
                      class="progress-fill"
                      :class="{ 'week-done': isWeekDone(weekly) }"
                      :style="{ width: weeklyStats(weekly).completionPercentage }"
                    ></div>
                  </div>
                  <span class="progress-text">
                    {{ weeklyStats(weekly).completedCount }} / {{ weeklyStats(weekly).requiredCount }}
                  </span>
                </div>
              </div>

              <div class="weekly-actions">
                <button
                  v-if="canCompleteThisWeek(weekly)"
                  @click="completeWeekly(weekly)"
                  class="complete-btn"
                  :disabled="completingWeeklyId === weekly.id"
                  title="Отметить один подход выполненным"
                >
                  ✓ Выполнить
                </button>
                <span v-else-if="isWeekDone(weekly)" class="week-done-badge">✓ неделя выполнена</span>
                <button @click="openEditWeekly(weekly)" class="action-btn edit-btn" title="Редактировать">✏️</button>
                <button @click="confirmDeleteWeekly(weekly)" class="action-btn delete-btn" title="Удалить">🗑️</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Задачи проекта -->
        <div class="detail-section">
          <div class="section-head">
            <h3>📝 Задачи</h3>
            <div class="tasks-subtabs">
              <button
                type="button"
                class="tasks-subtab"
                :class="{ active: projectTasksTab === 'active' }"
                @click="projectTasksTab = 'active'"
              >
                Актуальные <span class="subtab-count">{{ selectedProjectTasks.length }}</span>
              </button>
              <button
                type="button"
                class="tasks-subtab"
                :class="{ active: projectTasksTab === 'archive' }"
                @click="projectTasksTab = 'archive'"
              >
                🗄 Архив <span class="subtab-count">{{ archivedSelectedProjectTasks.length }}</span>
              </button>
            </div>
            <span class="section-count">{{ visibleProjectTasks.length }}</span>
          </div>

          <TaskListSection
            :tasks="visibleProjectTasks"
            :projects="projects"
            :default-project-name="selectedProject.name"
            :show-project-name="false"
            :empty-text="projectTasksTab === 'archive'
              ? 'Выполненных задач у проекта пока нет.'
              : 'Невыполненных задач у проекта нет. Выполненные — в Архиве.'"
            @changed="$emit('changed')"
          />
        </div>
      </template>

      <!-- Группа «Без проекта» -->
      <template v-else-if="selectedKey === '__none__'">
        <div class="detail-header">
          <div class="detail-title">
            <h2>Без проекта</h2>
          </div>
        </div>
        <p class="orphan-hint">
          Здесь собраны задачи, название проекта которых не совпадает ни с одним существующим проектом.
        </p>

        <div class="detail-section">
          <div class="section-head">
            <h3>📝 Задачи</h3>
            <div class="tasks-subtabs">
              <button
                type="button"
                class="tasks-subtab"
                :class="{ active: projectTasksTab === 'active' }"
                @click="projectTasksTab = 'active'"
              >
                Актуальные <span class="subtab-count">{{ orphanTasks.length }}</span>
              </button>
              <button
                type="button"
                class="tasks-subtab"
                :class="{ active: projectTasksTab === 'archive' }"
                @click="projectTasksTab = 'archive'"
              >
                🗄 Архив <span class="subtab-count">{{ archivedOrphanTasks.length }}</span>
              </button>
            </div>
            <span class="section-count">{{ visibleProjectTasks.length }}</span>
          </div>

          <TaskListSection
            :tasks="visibleProjectTasks"
            :projects="projects"
            :empty-text="projectTasksTab === 'archive'
              ? 'Выполненных задач без проекта пока нет.'
              : 'Все невыполненные задачи относятся к проектам.'"
            @changed="$emit('changed')"
          />
        </div>
      </template>

      <!-- Ничего не выбрано -->
      <div v-else class="no-selection">
        <p>👈 Выберите проект слева, чтобы увидеть его цели, еженедельные задачи и задачи</p>
      </div>
    </section>

    <!-- Модальное окно создания/редактирования проекта -->
    <ProjectFormModal
      :visible="showFormModal"
      :project="editingProject"
      @close="closeFormModal"
      @saved="handleProjectSaved"
    />

    <!-- Модальное окно еженедельной задачи -->
    <WeeklyTaskFormModal
      :visible="showWeeklyModal"
      :task="editingWeekly"
      :projects="projects"
      :default-project-name="selectedProject ? selectedProject.name : ''"
      @close="closeWeeklyModal"
      @saved="handleWeeklySaved"
    />

    <!-- Модальное окно подтверждения удаления проекта -->
    <div v-if="showDeleteProjectModal" class="modal-overlay" @click="closeDeleteProjectModal">
      <div class="modal-content modal-small" @click.stop>
        <h3>Подтверждение удаления</h3>
        <p>
          Вы уверены, что хотите удалить проект "{{ projectToDelete?.name }}"?
          Привязанные задачи останутся в системе.
        </p>
        <div class="form-actions">
          <button @click="closeDeleteProjectModal" class="cancel-btn">Отмена</button>
          <button @click="removeProject" class="delete-btn-confirm" :disabled="deleting">
            {{ deleting ? 'Удаление...' : 'Удалить' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Модальное окно подтверждения удаления еженедельной задачи -->
    <div v-if="showDeleteWeeklyModal" class="modal-overlay" @click="closeDeleteWeeklyModal">
      <div class="modal-content modal-small" @click.stop>
        <h3>Подтверждение удаления</h3>
        <p>Вы уверены, что хотите удалить еженедельную задачу "{{ weeklyToDelete?.name }}"?</p>
        <div class="form-actions">
          <button @click="closeDeleteWeeklyModal" class="cancel-btn">Отмена</button>
          <button @click="removeWeekly" class="delete-btn-confirm" :disabled="deleting">
            {{ deleting ? 'Удаление...' : 'Удалить' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { deleteProject } from '../../api/projects.js';
import { deleteWeeklyTask, completeWeeklyTask } from '../../api/weeklyTasks.js';
import { updateGoalStatus } from '../../api/goals.js';
import ProjectFormModal from '../ProjectFormModal.vue';
import TaskListSection from './TaskListSection.vue';
import WeeklyTaskFormModal from './WeeklyTaskFormModal.vue';
import { ACTIVE_PROJECT_STATUSES, ALL_PROJECT_STATUSES } from '../../api/projects.js';

const STATUS_FILTER_STATUSES = {
  ACTIVE: ACTIVE_PROJECT_STATUSES,
  ALL: ALL_PROJECT_STATUSES,
  DONE: ['DONE'],
  ARCHIVED: ['ARCHIVED']
};

export default {
  name: 'ProjectsPanel',

  components: {
    ProjectFormModal,
    TaskListSection,
    WeeklyTaskFormModal
  },

  props: {
    projects: {
      type: Array,
      default: () => []
    },
    tasks: {
      type: Array,
      default: () => []
    },
    // Map weeklyTaskId -> { completedCount, requiredCount, completionPercentage, completedToday }
    weekMap: {
      type: Object,
      default: () => ({})
    }
  },

  emits: ['changed', 'statuses-changed'],

  data() {
    return {
      selectedKey: null,

      // Подвкладка секции «Задачи»: 'active' | 'archive'
      projectTasksTab: 'active',

      // Фильтры списка проектов
      // statusFilter — серверный фильтр по статусам (см. STATUS_FILTER_STATUSES)
      statusFilter: 'ACTIVE',
      searchQuery: '',
      filterPriority: '',

      // Форма проекта
      showFormModal: false,
      editingProject: null,

      // Форма еженедельной задачи
      showWeeklyModal: false,
      editingWeekly: null,

      // Переключение целей
      togglingGoals: [],

      // Отметка выполнения еженедельной задачи
      completingWeeklyId: null,

      // Удаление проекта
      showDeleteProjectModal: false,
      projectToDelete: null,
      deleting: false,

      // Удаление еженедельной задачи
      showDeleteWeeklyModal: false,
      weeklyToDelete: null
    };
  },

  computed: {
    filteredProjects() {
      return this.projects.filter(project => {
        if (this.searchQuery && !project.name?.toLowerCase().includes(this.searchQuery.toLowerCase())) {
          return false;
        }
        if (this.filterPriority && project.priority !== this.filterPriority) {
          return false;
        }
        return true;
      });
    },

    selectedProject() {
      if (this.selectedKey == null || this.selectedKey === '__none__') {
        return null;
      }
      return this.projects.find(p => p.id === this.selectedKey) || null;
    },

    goalList() {
      return this.selectedProject?.goalList || [];
    },

    allGoalsDone() {
      return this.goalList.length > 0 && this.goalList.every(g => g.isCompleted);
    },

    weeklyList() {
      return this.selectedProject?.weeklyList || [];
    },

    orphanTasks() {
      return this.tasks.filter(task => !task.isComplete && this.isOrphanTask(task));
    },

    archivedOrphanTasks() {
      return this.tasks.filter(task => !!task.isComplete && this.isOrphanTask(task));
    },

    selectedProjectTasks() {
      return this.tasks.filter(task => !task.isComplete && this.belongsToSelectedProject(task));
    },

    archivedSelectedProjectTasks() {
      return this.tasks.filter(task => !!task.isComplete && this.belongsToSelectedProject(task));
    },

    visibleProjectTasks() {
      if (this.selectedKey === '__none__') {
        return this.projectTasksTab === 'archive' ? this.archivedOrphanTasks : this.orphanTasks;
      }
      return this.projectTasksTab === 'archive'
        ? this.archivedSelectedProjectTasks
        : this.selectedProjectTasks;
    }
  },

  methods: {
    select(key) {
      this.selectedKey = key;
      this.projectTasksTab = 'active';
    },

    isOrphanTask(task) {
      const names = new Set(this.projects.map(p => p.name));
      const ids = new Set(this.projects.map(p => p.id));

      const pid = task.project?.id;
      if (pid != null) {
        return !ids.has(pid);
      }
      const pname = task.project?.name;
      return !pname || !names.has(pname);
    },

    belongsToSelectedProject(task) {
      const project = this.selectedProject;
      if (!project) {
        return false;
      }
      if (task.project?.id != null) {
        return task.project.id === project.id;
      }
      return task.project?.name === project.name;
    },

    activeTasksCount(project) {
      return (project.taskList || []).filter(task => !task.isComplete).length;
    },

    applyStatusFilter() {
      const statuses = STATUS_FILTER_STATUSES[this.statusFilter] || ACTIVE_PROJECT_STATUSES;
      this.$emit('statuses-changed', statuses);
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

    getProjectStatusLabel(status) {
      const labels = {
        'ACTIVE': 'Активный',
        'COMPLETED': 'Завершён',
        'DONE': 'Завершён',
        'ARCHIVED': 'Архивирован',
        'IN_PROGRESS': 'В работе'
      };
      return labels[status] || status || '—';
    },

    getTaskStatusLabel(status) {
      const labels = {
        'IDEA': 'Идея',
        'BACKLOG': 'Бэклог',
        'IN_PROGRESS': 'В работе',
        'DONE': 'Выполнено',
        'PAUSED': 'На паузе',
        'CANCELED': 'Отменено'
      };
      return labels[status] || status || '—';
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

    completedGoalsCount(project) {
      return (project.goalList || []).filter(g => g.isCompleted).length;
    },

    goalsPercentage(project) {
      const goals = project.goalList || [];
      if (goals.length === 0) {
        return '0%';
      }
      return Math.round((this.completedGoalsCount(project) / goals.length) * 100) + '%';
    },

    /* --- Еженедельные задачи --- */

    weeklyStats(weekly) {
      return this.weekMap[weekly.id] || null;
    },

    isWeekDone(weekly) {
      const stats = this.weeklyStats(weekly);
      return !!stats && stats.completedCount >= stats.requiredCount;
    },

    canCompleteThisWeek(weekly) {
      return weekly.status === 'IN_PROGRESS'
        && !!this.weeklyStats(weekly)
        && !this.isWeekDone(weekly);
    },

    async completeWeekly(weekly) {
      this.completingWeeklyId = weekly.id;

      try {
        const response = await completeWeeklyTask(weekly.id);

        if (response.isSuccess) {
          this.$emit('changed');
        } else {
          alert('Не удалось отметить задачу: ' + (response.errorMessage || 'Неизвестная ошибка'));
        }
      } catch (err) {
        alert('Ошибка при отправке данных');
        console.error('Ошибка отметки еженедельной задачи:', err);
      } finally {
        this.completingWeeklyId = null;
      }
    },

    openCreateWeekly() {
      this.editingWeekly = null;
      this.showWeeklyModal = true;
    },

    openEditWeekly(weekly) {
      this.editingWeekly = weekly;
      this.showWeeklyModal = true;
    },

    closeWeeklyModal() {
      this.showWeeklyModal = false;
      this.editingWeekly = null;
    },

    handleWeeklySaved() {
      this.$emit('changed');
    },

    confirmDeleteWeekly(weekly) {
      this.weeklyToDelete = weekly;
      this.showDeleteWeeklyModal = true;
    },

    closeDeleteWeeklyModal() {
      this.showDeleteWeeklyModal = false;
      this.weeklyToDelete = null;
    },

    async removeWeekly() {
      if (!this.weeklyToDelete) {
        return;
      }

      this.deleting = true;

      try {
        const response = await deleteWeeklyTask(this.weeklyToDelete.id);

        if (response.isSuccess) {
          this.closeDeleteWeeklyModal();
          this.$emit('changed');
        } else {
          alert('Не удалось удалить задачу: ' + (response.errorMessage || 'Неизвестная ошибка'));
        }
      } catch (err) {
        alert('Ошибка при удалении задачи');
        console.error('Ошибка удаления еженедельной задачи:', err);
      } finally {
        this.deleting = false;
      }
    },

    /* --- Цели --- */

    async toggleGoal(goal, event) {
      const newStatus = event.target.checked;

      this.togglingGoals.push(goal.id);

      try {
        const response = await updateGoalStatus(goal.id, newStatus);

        if (response.isSuccess) {
          goal.isCompleted = newStatus;
        } else {
          event.target.checked = !newStatus;
          alert('Не удалось изменить статус цели: ' + (response.errorMessage || 'Неизвестная ошибка'));
        }
      } catch (err) {
        event.target.checked = !newStatus;
        alert('Ошибка при изменении статуса цели');
        console.error('Ошибка изменения статуса цели:', err);
      } finally {
        this.togglingGoals = this.togglingGoals.filter(id => id !== goal.id);
      }
    },

    /* --- Проекты --- */

    openCreateProject() {
      this.editingProject = null;
      this.showFormModal = true;
    },

    openEditProject(project) {
      this.editingProject = project;
      this.showFormModal = true;
    },

    closeFormModal() {
      this.showFormModal = false;
      this.editingProject = null;
    },

    handleProjectSaved(savedProject) {
      this.$emit('changed');

      // Выделяем сохранённый проект (появится в списке после обновления данных)
      if (savedProject?.id) {
        this.selectedKey = savedProject.id;
      }
    },

    confirmDeleteProject(project) {
      this.projectToDelete = project;
      this.showDeleteProjectModal = true;
    },

    closeDeleteProjectModal() {
      this.showDeleteProjectModal = false;
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
          if (this.selectedKey === this.projectToDelete.id) {
            this.selectedKey = null;
          }
          this.closeDeleteProjectModal();
          this.$emit('changed');
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

  watch: {
    projects(newList) {
      // Если выбранный проект исчез (удалён/отфильтрован) — сбрасываем выбор
      if (
        this.selectedKey != null
        && this.selectedKey !== '__none__'
        && !newList.some(p => p.id === this.selectedKey)
      ) {
        this.selectedKey = null;
      }
    }
  }
};
</script>

<style scoped>
.projects-panel {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 18px;
  align-items: start;
}

/* --- Левая колонка --- */
.projects-sidebar {
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: sticky;
  top: 15px;
}

.sidebar-toolbar {
  display: flex;
  gap: 8px;
}

.search-input {
  flex: 1;
  min-width: 0;
  padding: 9px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 13px;
}

.search-input:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.create-project-btn {
  padding: 9px 14px;
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

.create-project-btn:hover {
  background-color: #5a6fd6;
}

.sidebar-filters {
  display: flex;
  gap: 8px;
}

.filter-select {
  flex: 1;
  min-width: 0;
  padding: 7px 8px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 12px;
}

.project-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: calc(100vh - 220px);
  overflow-y: auto;
  padding-right: 2px;
}

.sidebar-empty {
  text-align: center;
  padding: 25px 15px;
  color: var(--text-muted);
  background-color: var(--bg-tertiary);
  border-radius: 8px;
  font-size: 13px;
}

.project-card {
  padding: 14px;
  border-radius: 10px;
  background-color: var(--bg-secondary);
  border: 2px solid var(--border-color);
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.project-card:hover {
  border-color: var(--accent-primary);
  box-shadow: 0 3px 10px var(--shadow-color);
}

.project-card.selected {
  border-color: var(--accent-primary);
  background-color: var(--bg-tertiary);
  box-shadow: 0 3px 10px var(--shadow-color);
}

.orphan-card {
  border-style: dashed;
  opacity: 0.9;
}

.card-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.card-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  word-break: break-word;
}

.card-badges {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.card-goals {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-goals-bar {
  flex: 1;
  height: 6px;
  background-color: var(--bg-tertiary);
  border-radius: 3px;
  overflow: hidden;
}

.card-goals-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-green), #7ed957);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.card-goals-text {
  font-size: 11px;
  color: var(--text-secondary);
  white-space: nowrap;
}

.card-counters {
  display: flex;
  gap: 8px;
}

.counter {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 10px;
  background-color: var(--bg-tertiary);
  color: var(--text-secondary);
}

.counter-weekly {
  border-left: 3px solid var(--accent-blue);
}

.counter-tasks {
  border-left: 3px solid var(--accent-purple);
}

/* --- Правая колонка --- */
.project-detail {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.detail-title h2 {
  color: var(--text-primary);
  margin: 0 0 8px 0;
  word-break: break-word;
}

.detail-badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.detail-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.detail-dates {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  font-size: 12px;
  color: var(--text-muted);
  margin-top: -10px;
}

.detail-section {
  padding: 16px;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-head h3 {
  color: var(--text-primary);
  margin: 0;
  font-size: 16px;
}

.section-count {
  min-width: 24px;
  height: 24px;
  padding: 0 8px;
  border-radius: 12px;
  background-color: var(--accent-gray-light);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.tasks-subtabs {
  display: inline-flex;
  gap: 3px;
  padding: 3px;
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  margin-left: auto;
}

.tasks-subtab {
  padding: 5px 12px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.tasks-subtab:hover {
  color: var(--text-primary);
}

.tasks-subtab.active {
  background-color: var(--accent-primary);
  color: white;
}

.subtab-count {
  font-size: 11px;
  font-weight: 600;
  padding: 1px 7px;
  border-radius: 10px;
  background-color: var(--bg-secondary);
  color: inherit;
}

.section-count.count-done {
  background-color: var(--accent-green-light);
  color: var(--accent-green);
}

.section-add-btn {
  margin-left: auto;
  padding: 6px 14px;
  border: 1px dashed var(--accent-primary);
  border-radius: 6px;
  background-color: transparent;
  color: var(--accent-primary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
  white-space: nowrap;
}

.section-add-btn:hover {
  background-color: var(--bg-tertiary);
}

.section-empty {
  font-size: 13px;
  color: var(--text-muted);
  font-style: italic;
  padding: 10px 12px;
  background-color: var(--bg-tertiary);
  border-radius: 6px;
}

/* Цели */
.goals-progress-bar {
  height: 8px;
  background-color: var(--bg-tertiary);
  border-radius: 4px;
  overflow: hidden;
}

.goals-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-green), #7ed957);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.goal-checklist {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.goal-check-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.goal-check-item:hover {
  background-color: var(--bg-tertiary);
}

.goal-check-item input[type="checkbox"] {
  accent-color: var(--accent-green);
  width: 16px;
  height: 16px;
  cursor: pointer;
  flex-shrink: 0;
}

.goal-check-item input[type="checkbox"]:disabled {
  cursor: wait;
  opacity: 0.6;
}

.goal-check-name {
  font-size: 14px;
  color: var(--text-primary);
  word-break: break-word;
}

.goal-check-name.goal-done {
  text-decoration: line-through;
  color: var(--text-muted);
}

/* Еженедельные задачи */
.weekly-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.weekly-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 8px;
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-color);
}

.weekly-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.weekly-top {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
}

.weekly-name {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
  word-break: break-word;
}

.weekly-count {
  font-size: 11px;
  color: var(--text-secondary);
  background-color: var(--bg-secondary);
  padding: 2px 8px;
  border-radius: 10px;
  white-space: nowrap;
}

.weekly-meta {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.weekly-progress {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 2px;
}

.progress-bar {
  flex: 1;
  max-width: 260px;
  height: 8px;
  background-color: var(--bg-secondary);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-blue), var(--accent-primary));
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-fill.week-done {
  background: linear-gradient(90deg, var(--accent-green), #7ed957);
}

.progress-text {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
}

.weekly-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.complete-btn {
  padding: 7px 14px;
  background-color: var(--accent-green);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
  white-space: nowrap;
}

.complete-btn:hover:not(:disabled) {
  background-color: #3d8b40;
}

.complete-btn:disabled {
  opacity: 0.6;
  cursor: wait;
}

.week-done-badge {
  font-size: 11px;
  font-weight: 600;
  color: var(--accent-green);
  background-color: var(--accent-green-light);
  padding: 4px 10px;
  border-radius: 10px;
  white-space: nowrap;
}

.action-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background-color: var(--bg-secondary);
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

/* Группа «Без проекта» */
.orphan-hint {
  font-size: 13px;
  color: var(--text-secondary);
  margin: -6px 0 0 0;
}

.no-selection {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-muted);
  background-color: var(--bg-secondary);
  border: 2px dashed var(--border-color);
  border-radius: 12px;
}

/* Бейджи */
.badge {
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

/* Модальные окна подтверждения */
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
@media (max-width: 900px) {
  .projects-panel {
    grid-template-columns: 1fr;
  }

  .projects-sidebar {
    position: static;
  }

  .project-cards {
    max-height: none;
  }

  .weekly-row {
    flex-direction: column;
    align-items: stretch;
  }

  .weekly-actions {
    justify-content: flex-end;
  }
}
</style>
