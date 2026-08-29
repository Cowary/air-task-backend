<template>
  <div v-if="visible" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <h3>{{ isEdit ? 'Редактировать еженедельную задачу' : 'Создать еженедельную задачу' }}</h3>

      <form @submit.prevent="handleSave" class="task-form">
        <div class="form-group">
          <label for="wsWeeklyName">Название задачи *</label>
          <input
            id="wsWeeklyName"
            v-model.trim="form.name"
            type="text"
            required
            maxlength="100"
            placeholder="Введите название задачи"
          />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="wsWeeklyCount">Раз в неделю *</label>
            <input
              id="wsWeeklyCount"
              v-model.number="form.count"
              type="number"
              min="1"
              max="7"
              required
              placeholder="1"
            />
          </div>

          <div class="form-group">
            <label for="wsWeeklyPriority">Приоритет</label>
            <select id="wsWeeklyPriority" v-model="form.priority">
              <option value="HIGH">Высокий</option>
              <option value="MIDDLE">Средний</option>
              <option value="LOW">Низкий</option>
            </select>
          </div>

          <div class="form-group">
            <label for="wsWeeklyStatus">Статус</label>
            <select id="wsWeeklyStatus" v-model="form.status">
              <option value="IN_PROGRESS">В работе</option>
              <option value="DONE">Выполнено</option>
              <option value="PAUSED">На паузе</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label for="wsWeeklyProject">Проект *</label>
          <select
            id="wsWeeklyProject"
            v-model="form.projectName"
            required
          >
            <option value="" disabled>Выберите проект</option>
            <option
              v-for="project in projects"
              :key="project.id"
              :value="project.name"
            >
              {{ project.name }}
            </option>
            <option value="__custom__">Другой проект (ввести название)</option>
          </select>
          <input
            v-if="isCustomProject"
            v-model.trim="form.customProjectName"
            type="text"
            class="custom-project-input"
            maxlength="100"
            required
            placeholder="Введите название проекта"
          />
          <span class="form-hint">Еженедельные задачи всегда относятся к проекту; по умолчанию — «Без проекта».</span>
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
import { createWeeklyTask, updateWeeklyTask } from '../../api/weeklyTasks.js';

export default {
  name: 'WeeklyTaskFormModal',

  props: {
    visible: {
      type: Boolean,
      required: true
    },
    task: {
      type: Object,
      default: null
    },
    projects: {
      type: Array,
      default: () => []
    },
    defaultProjectName: {
      type: String,
      default: ''
    }
  },

  emits: ['close', 'saved'],

  data() {
    return {
      saving: false,
      form: {
        name: '',
        count: 1,
        projectName: '',
        customProjectName: '',
        priority: 'MIDDLE',
        status: 'IN_PROGRESS'
      }
    };
  },

  computed: {
    isEdit() {
      return !!this.task;
    },

    isCustomProject() {
      return this.form.projectName === '__custom__';
    },

    resolvedProjectName() {
      return this.isCustomProject ? this.form.customProjectName : this.form.projectName;
    }
  },

  watch: {
    visible(newVisible) {
      if (newVisible) {
        this.initForm();
      }
    }
  },

  methods: {
    projectNames() {
      return this.projects.map(p => p.name);
    },

    noProjectName() {
      const project = this.projects.find(p => p.name === 'Без проекта');
      return project ? project.name : '';
    },

    initForm() {
      if (this.task) {
        const projectName = this.task.project?.name || '';
        const known = this.projectNames().includes(projectName);

        this.form = {
          name: this.task.name || '',
          count: this.task.count || 1,
          projectName: known ? projectName : '__custom__',
          customProjectName: known ? '' : projectName,
          priority: this.task.priority || 'MIDDLE',
          status: this.task.status || 'IN_PROGRESS'
        };
        return;
      }

      const defaultName = this.defaultProjectName;
      const known = defaultName && this.projectNames().includes(defaultName);

      if (known) {
        this.form = {
          name: '',
          count: 1,
          projectName: defaultName,
          customProjectName: '',
          priority: 'MIDDLE',
          status: 'IN_PROGRESS'
        };
        return;
      }

      const fallbackDefault = this.noProjectName();

      this.form = {
        name: '',
        count: 1,
        projectName: fallbackDefault || (this.projects.length > 0 ? this.projects[0].name : '__custom__'),
        customProjectName: fallbackDefault || this.projects.length > 0 ? '' : defaultName,
        priority: 'MIDDLE',
        status: 'IN_PROGRESS'
      };
    },

    closeModal() {
      this.$emit('close');
    },

    async handleSave() {
      if (!this.form.name || !this.form.count || !this.resolvedProjectName) {
        alert('Пожалуйста, заполните все обязательные поля');
        return;
      }

      this.saving = true;

      try {
        const payload = {
          name: this.form.name,
          count: Number(this.form.count) || 1,
          projectName: this.resolvedProjectName,
          priority: this.form.priority,
          status: this.form.status
        };

        const response = this.isEdit
          ? await updateWeeklyTask(this.task.id, payload)
          : await createWeeklyTask(payload);

        if (response.isSuccess) {
          this.$emit('saved', response.data);
          this.closeModal();
        } else {
          alert('Не удалось сохранить задачу: ' + (response.errorMessage || 'Неизвестная ошибка'));
        }
      } catch (err) {
        alert('Ошибка при сохранении задачи');
        console.error('Ошибка сохранения еженедельной задачи:', err);
      } finally {
        this.saving = false;
      }
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
  z-index: 1100;
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
  max-width: 520px;
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

.task-form {
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

.custom-project-input {
  margin-top: 2px;
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
