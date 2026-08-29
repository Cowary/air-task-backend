<template>
  <div v-if="visible" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <h3>{{ isEdit ? 'Редактировать задачу' : 'Создать новую задачу' }}</h3>

      <form @submit.prevent="handleSave" class="task-form">
        <div class="form-group">
          <label for="wsTaskName">Название задачи *</label>
          <input
            id="wsTaskName"
            v-model.trim="form.name"
            type="text"
            required
            maxlength="200"
            placeholder="Введите название задачи"
          />
        </div>

        <div class="form-group">
          <label for="wsTaskProject">Проект *</label>
          <select
            id="wsTaskProject"
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
          <span class="form-hint">
            Для задач вне конкретных проектов используйте проект «Без проекта».
          </span>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="wsTaskPriority">Приоритет *</label>
            <select id="wsTaskPriority" v-model="form.priority" required>
              <option value="HIGH">Высокий</option>
              <option value="MIDDLE">Средний</option>
              <option value="LOW">Низкий</option>
            </select>
          </div>

          <div class="form-group">
            <label for="wsTaskStatus">Статус *</label>
            <select id="wsTaskStatus" v-model="form.status" required>
              <option value="IDEA">Идея</option>
              <option value="BACKLOG">Бэклог</option>
              <option value="IN_PROGRESS">В работе</option>
              <option value="DONE">Выполнено</option>
              <option value="PAUSED">На паузе</option>
              <option value="CANCELED">Отменено</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label for="wsTaskDescription">Описание</label>
          <textarea
            id="wsTaskDescription"
            v-model="form.description"
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
</template>

<script>
import { createTask, updateTask } from '../../api/tasks.js';

export default {
  name: 'TaskFormModal',

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
        projectName: '',
        customProjectName: '',
        priority: 'MIDDLE',
        status: 'IN_PROGRESS',
        description: ''
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

        if (!projectName) {
          this.form = {
            name: this.task.name || '',
            projectName: this.noProjectName() || '__custom__',
            customProjectName: this.noProjectName() ? '' : projectName,
            priority: this.task.priority || 'MIDDLE',
            status: this.task.status || 'IN_PROGRESS',
            description: this.task.description || ''
          };
          return;
        }

        const known = this.projectNames().includes(projectName);

        this.form = {
          name: this.task.name || '',
          projectName: known ? projectName : '__custom__',
          customProjectName: known ? '' : projectName,
          priority: this.task.priority || 'MIDDLE',
          status: this.task.status || 'IN_PROGRESS',
          description: this.task.description || ''
        };
        return;
      }

      const explicitDefault = this.defaultProjectName;

      if (explicitDefault) {
        const known = this.projectNames().includes(explicitDefault);

        this.form = {
          name: '',
          projectName: known ? explicitDefault : '__custom__',
          customProjectName: known ? '' : explicitDefault,
          priority: 'MIDDLE',
          status: 'IN_PROGRESS',
          description: ''
        };
        return;
      }

      const fallbackDefault = this.noProjectName();

      this.form = {
        name: '',
        projectName: fallbackDefault || '__custom__',
        customProjectName: '',
        priority: 'MIDDLE',
        status: 'IN_PROGRESS',
        description: ''
      };
    },

    closeModal() {
      this.$emit('close');
    },

    async handleSave() {
      if (!this.form.name || !this.resolvedProjectName) {
        alert('Пожалуйста, заполните все обязательные поля');
        return;
      }

      this.saving = true;

      try {
        const payload = {
          name: this.form.name,
          projectName: this.resolvedProjectName,
          priority: this.form.priority,
          status: this.form.status,
          description: this.form.description
        };

        const response = this.isEdit
          ? await updateTask({ id: this.task.id, ...payload })
          : await createTask(payload);

        if (response.isSuccess) {
          this.$emit('saved', response.data);
          this.closeModal();
        } else {
          alert('Не удалось сохранить задачу: ' + (response.errorMessage || 'Неизвестная ошибка'));
        }
      } catch (err) {
        alert('Ошибка при сохранении задачи');
        console.error('Ошибка сохранения задачи:', err);
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

.form-group textarea {
  resize: vertical;
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
