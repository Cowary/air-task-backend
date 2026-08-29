<template>
  <div v-if="visible" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <h3>{{ isEdit ? 'Редактировать проект' : 'Создать новый проект' }}</h3>

      <form @submit.prevent="handleSave" class="project-form">
        <div class="form-group">
          <label for="projectName">Название проекта *</label>
          <input
            id="projectName"
            v-model.trim="form.name"
            type="text"
            required
            maxlength="100"
            placeholder="Введите название проекта"
          />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="projectStatus">Статус</label>
            <select id="projectStatus" v-model="form.status">
              <option value="ACTIVE">Активный</option>
              <option value="COMPLETED">Завершён</option>
              <option value="ARCHIVED">Архивирован</option>
            </select>
          </div>

          <div class="form-group">
            <label for="projectPriority">Приоритет</label>
            <select id="projectPriority" v-model="form.priority">
              <option value="HIGH">Высокий</option>
              <option value="MIDDLE">Средний</option>
              <option value="LOW">Низкий</option>
            </select>
          </div>
        </div>

        <!-- Цели проекта -->
        <div class="link-section">
          <div class="link-section-header">
            <span class="link-section-title">🎯 Цели</span>
            <span class="link-count">{{ goals.length }}</span>
            <button type="button" @click="addGoal" class="add-goal-btn">+ Добавить цель</button>
          </div>
          <div v-if="goals.length === 0" class="link-empty">Нет целей. Добавьте первую цель проекта.</div>
          <div v-else class="goal-list">
            <div v-for="(goal, index) in goals" :key="goal.key" class="goal-item">
              <input type="checkbox" v-model="goal.isCompleted" class="goal-checkbox" title="Цель достигнута" />
              <input
                v-model.trim="goal.name"
                type="text"
                class="goal-name-input"
                maxlength="100"
                placeholder="Название цели"
              />
              <button
                type="button"
                @click="removeGoal(index)"
                class="goal-remove-btn"
                title="Удалить цель"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>

        <!-- Привязка еженедельных задач -->
        <div class="link-section">
          <div class="link-section-header">
            <span class="link-section-title">📊 Еженедельные задачи</span>
            <span class="link-count">{{ selectedWeeklyIds.length }}</span>
          </div>
          <input
            v-model.trim="weeklySearch"
            type="text"
            class="link-search"
            placeholder="Поиск по названию..."
          />
          <div v-if="loadingWeekly" class="link-loading">Загрузка...</div>
          <div v-else-if="filteredWeekly.length === 0" class="link-empty">Нет доступных задач</div>
          <div v-else class="link-list">
            <label
              v-for="weekly in filteredWeekly"
              :key="weekly.id"
              class="link-item"
            >
              <input type="checkbox" :value="weekly.id" v-model="selectedWeeklyIds" />
              <span class="link-item-name">{{ weekly.name }}</span>
              <span class="link-item-meta">{{ weekly.count }} р/нед</span>
              <span
                v-if="weekly.project?.name && weekly.project.name !== form.name"
                class="link-item-project"
              >
                {{ weekly.project.name }}
              </span>
            </label>
          </div>
        </div>

        <!-- Привязка задач -->
        <div class="link-section">
          <div class="link-section-header">
            <span class="link-section-title">📝 Задачи</span>
            <span class="link-count">{{ selectedTaskIds.length }}</span>
          </div>
          <input
            v-model.trim="taskSearch"
            type="text"
            class="link-search"
            placeholder="Поиск по названию..."
          />
          <div v-if="loadingTasks" class="link-loading">Загрузка...</div>
          <div v-else-if="filteredTasks.length === 0" class="link-empty">Нет доступных задач</div>
          <div v-else class="link-list">
            <label
              v-for="task in filteredTasks"
              :key="task.id"
              class="link-item"
            >
              <input type="checkbox" :value="task.id" v-model="selectedTaskIds" />
              <span class="link-item-name">{{ task.name }}</span>
              <span
                v-if="task.project?.name && task.project.name !== form.name"
                class="link-item-project"
              >
                {{ task.project.name }}
              </span>
            </label>
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
</template>

<script>
import { createProject, updateProject } from '../api/projects.js';
import { getAllWeeklyTasks } from '../api/weeklyTasks.js';
import { getTasks } from '../api/tasks.js';
import { createGoal, updateGoal, deleteGoal } from '../api/goals.js';

const PROJECT_FILTER_STATUSES = ['IDEA', 'BACKLOG', 'IN_PROGRESS', 'PAUSED'];

export default {
  name: 'ProjectFormModal',

  props: {
    visible: {
      type: Boolean,
      required: true
    },
    project: {
      type: Object,
      default: null
    }
  },

  emits: ['close', 'saved'],

  data() {
    return {
      form: {
        name: '',
        status: 'ACTIVE',
        priority: 'MIDDLE'
      },
      weeklyOptions: [],
      taskOptions: [],
      selectedWeeklyIds: [],
      selectedTaskIds: [],
      weeklySearch: '',
      taskSearch: '',
      loadingWeekly: false,
      loadingTasks: false,
      goals: [],
      initialGoals: [],
      goalKeyCounter: 0,
      saving: false
    };
  },

  computed: {
    isEdit() {
      return !!this.project;
    },

    filteredWeekly() {
      if (!this.weeklySearch) return this.weeklyOptions;
      const query = this.weeklySearch.toLowerCase();
      return this.weeklyOptions.filter(w => w.name?.toLowerCase().includes(query));
    },

    filteredTasks() {
      if (!this.taskSearch) return this.taskOptions;
      const query = this.taskSearch.toLowerCase();
      return this.taskOptions.filter(t => t.name?.toLowerCase().includes(query));
    }
  },

  watch: {
    visible(newVisible) {
      if (newVisible) {
        this.initForm();
        this.loadOptions();
      }
    }
  },

  methods: {
    initForm() {
      if (this.project) {
        this.form = {
          name: this.project.name || '',
          status: this.project.status || 'ACTIVE',
          priority: this.project.priority || 'MIDDLE'
        };
        this.selectedWeeklyIds = (this.project.weeklyList || []).map(w => w.id);
        this.selectedTaskIds = (this.project.taskList || []).map(t => t.id);
        this.goals = (this.project.goalList || []).map(g => ({
          key: ++this.goalKeyCounter,
          id: g.id,
          name: g.name || '',
          isCompleted: !!g.isCompleted
        }));
      } else {
        this.form = {
          name: '',
          status: 'ACTIVE',
          priority: 'MIDDLE'
        };
        this.selectedWeeklyIds = [];
        this.selectedTaskIds = [];
        this.goals = [];
      }
      this.initialGoals = this.goals.map(g => ({
        id: g.id,
        name: g.name,
        isCompleted: g.isCompleted
      }));
      this.weeklySearch = '';
      this.taskSearch = '';
    },

    addGoal() {
      this.goals.push({
        key: ++this.goalKeyCounter,
        id: null,
        name: '',
        isCompleted: false
      });
    },

    removeGoal(index) {
      this.goals.splice(index, 1);
    },

    async loadOptions() {
      this.loadingWeekly = true;
      this.loadingTasks = true;

      try {
        const weeklyResponse = await getAllWeeklyTasks(PROJECT_FILTER_STATUSES);
        if (weeklyResponse.isSuccess) {
          this.weeklyOptions = weeklyResponse.data || [];
        }
      } catch (err) {
        console.error('Ошибка загрузки еженедельных задач:', err);
      } finally {
        this.loadingWeekly = false;
      }

      try {
        const taskResponse = await getTasks(PROJECT_FILTER_STATUSES);
        if (taskResponse.isSuccess) {
          this.taskOptions = taskResponse.data || [];
        }
      } catch (err) {
        console.error('Ошибка загрузки задач:', err);
      } finally {
        this.loadingTasks = false;
      }
    },

    closeModal() {
      this.$emit('close');
    },

    async handleSave() {
      if (!this.form.name) {
        alert('Пожалуйста, введите название проекта');
        return;
      }

      this.saving = true;

      try {
        let response;
        let projectId;

        if (this.isEdit) {
          projectId = this.project.id;
          response = await updateProject(projectId, {
            name: this.form.name,
            status: this.form.status,
            priority: this.form.priority,
            weeklyIds: this.selectedWeeklyIds,
            taskIds: this.selectedTaskIds
          });
        } else {
          response = await createProject(this.form);

          if (response.isSuccess && response.data?.id) {
            projectId = response.data.id;
            const hasLinks = this.selectedWeeklyIds.length > 0 || this.selectedTaskIds.length > 0;
            if (hasLinks) {
              response = await updateProject(projectId, {
                name: this.form.name,
                status: this.form.status,
                priority: this.form.priority,
                weeklyIds: this.selectedWeeklyIds,
                taskIds: this.selectedTaskIds
              });
            }
          }
        }

        if (!response.isSuccess) {
          alert('Не удалось сохранить проект: ' + (response.errorMessage || 'Неизвестная ошибка'));
          return;
        }

        if (projectId) {
          const goalErrors = await this.saveGoals(projectId);
          if (goalErrors.length > 0) {
            alert('Проект сохранён, но с целями возникли ошибки:\n' + goalErrors.join('\n'));
          }
        }

        this.$emit('saved', response.data);
        this.closeModal();
      } catch (err) {
        alert('Ошибка при сохранении проекта');
        console.error('Ошибка сохранения проекта:', err);
      } finally {
        this.saving = false;
      }
    },

    async saveGoals(projectId) {
      const errors = [];
      const currentIds = new Set(
        this.goals.filter(g => g.id != null).map(g => g.id)
      );

      for (const old of this.initialGoals) {
        if (!currentIds.has(old.id)) {
          try {
            const res = await deleteGoal(old.id);
            if (!res.isSuccess) {
              errors.push(`Не удалось удалить цель «${old.name}»: ${res.errorMessage || 'ошибка'}`);
            }
          } catch (err) {
            errors.push(`Ошибка при удалении цели «${old.name}»`);
          }
        }
      }

      for (const goal of this.goals) {
        if (!goal.name) {
          continue;
        }

        try {
          if (goal.id == null) {
            const res = await createGoal({
              name: goal.name,
              projectId,
              isCompleted: goal.isCompleted
            });
            if (!res.isSuccess) {
              errors.push(`Не удалось создать цель «${goal.name}»: ${res.errorMessage || 'ошибка'}`);
            }
          } else {
            const original = this.initialGoals.find(g => g.id === goal.id);
            const changed = !original
              || original.name !== goal.name
              || original.isCompleted !== goal.isCompleted;
            if (changed) {
              const res = await updateGoal(goal.id, {
                name: goal.name,
                projectId,
                isCompleted: goal.isCompleted
              });
              if (!res.isSuccess) {
                errors.push(`Не удалось обновить цель «${goal.name}»: ${res.errorMessage || 'ошибка'}`);
              }
            }
          }
        } catch (err) {
          errors.push(`Ошибка при сохранении цели «${goal.name}»`);
        }
      }

      return errors;
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
  max-width: 640px;
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

.modal-content h3 {
  color: var(--text-primary);
  margin-bottom: 20px;
  text-align: center;
}

.project-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-row {
  display: flex;
  gap: 15px;
}

.form-row .form-group {
  flex: 1;
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

/* Секции привязки */
.link-section {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.link-section-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.link-section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.link-count {
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: 11px;
  background-color: var(--accent-primary);
  color: white;
  font-size: 12px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.link-search {
  padding: 8px 10px;
  border: 1px solid var(--border-color);
  border-radius: 5px;
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  font-size: 13px;
  font-family: inherit;
}

.link-search:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.link-list {
  max-height: 160px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.link-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-primary);
  transition: background-color 0.15s ease;
}

.link-item:hover {
  background-color: var(--bg-tertiary);
}

.link-item input[type="checkbox"] {
  accent-color: var(--accent-primary);
  cursor: pointer;
  flex-shrink: 0;
}

.link-item-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.link-item-meta {
  font-size: 11px;
  color: var(--text-muted);
  flex-shrink: 0;
}

.link-item-project {
  font-size: 11px;
  color: var(--accent-primary);
  background-color: var(--accent-gray-light);
  padding: 2px 8px;
  border-radius: 10px;
  flex-shrink: 0;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.link-loading,
.link-empty {
  font-size: 13px;
  color: var(--text-muted);
  font-style: italic;
  padding: 8px 0;
}

/* Цели проекта */
.add-goal-btn {
  margin-left: auto;
  padding: 5px 12px;
  border: 1px dashed var(--accent-primary);
  border-radius: 5px;
  background-color: transparent;
  color: var(--accent-primary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.add-goal-btn:hover {
  background-color: var(--bg-tertiary);
}

.goal-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 200px;
  overflow-y: auto;
}

.goal-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.goal-checkbox {
  accent-color: var(--accent-green);
  cursor: pointer;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
}

.goal-name-input {
  flex: 1;
  padding: 7px 10px;
  border: 1px solid var(--border-color);
  border-radius: 5px;
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  font-size: 13px;
  font-family: inherit;
}

.goal-name-input:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.goal-remove-btn {
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: 5px;
  background-color: transparent;
  cursor: pointer;
  font-size: 13px;
  flex-shrink: 0;
  transition: background-color 0.2s ease;
}

.goal-remove-btn:hover {
  background-color: var(--accent-red-light);
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 10px;
}

.cancel-btn,
.save-btn {
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

@media (max-width: 600px) {
  .form-row {
    flex-direction: column;
  }
}
</style>
