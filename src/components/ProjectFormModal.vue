<template>
  <Teleport to="body">
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

            <div class="form-group">
              <label for="projectDueDate">Дата выполнения</label>
              <DateField id="projectDueDate" v-model="form.dueDate" />
            </div>
          </div>

          <!-- Привязка еженедельных задач -->
          <div class="link-section">
            <div class="link-section-header">
              <span class="link-section-title"><AppIcon name="chart-column" :size="16" /> Еженедельные задачи</span>
              <span class="link-count">{{ newWeeklies.length }}</span>
              <button type="button" @click="addWeeklyDraft" class="add-draft-btn">+ Добавить задачу</button>
            </div>
            <div v-if="newWeeklies.length > 0" class="draft-list">
              <div v-for="(draft, index) in newWeeklies" :key="draft.key" class="draft-item">
                <span class="draft-badge">новая</span>
                <input
                  v-model.trim="draft.name"
                  type="text"
                  class="draft-name-input"
                  maxlength="100"
                  placeholder="Название задачи"
                />
                <input
                  v-model.number="draft.count"
                  type="number"
                  min="1"
                  class="draft-count"
                  title="Раз в неделю"
                />
                <select v-model="draft.priority" class="draft-select" title="Приоритет">
                  <option value="LOW">Низкий</option>
                  <option value="MIDDLE">Средний</option>
                  <option value="HIGH">Высокий</option>
                </select>
                <select v-model="draft.status" class="draft-select" title="Статус">
                  <option value="IN_PROGRESS">В работе</option>
                  <option value="DONE">Выполнено</option>
                  <option value="PAUSED">На паузе</option>
                </select>
                <button
                  type="button"
                  @click="removeWeeklyDraft(index)"
                  class="draft-remove-btn"
                  title="Убрать"
                  aria-label="Убрать"
                >
                  <AppIcon name="trash-2" :size="15" />
                </button>
              </div>
            </div>
            <div v-else class="link-empty">Добавьте новые еженедельные задачи.</div>
          </div>

          <!-- Привязка задач -->
          <div class="link-section">
            <div class="link-section-header">
              <span class="link-section-title"><AppIcon name="list-checks" :size="16" /> Задачи</span>
              <span class="link-count">{{ newTasks.length }}</span>
              <button type="button" @click="addTaskDraft" class="add-draft-btn">+ Добавить задачу</button>
            </div>
            <div v-if="newTasks.length > 0" class="draft-list">
              <div v-for="(draft, index) in newTasks" :key="draft.key" class="draft-item">
                <span class="draft-badge">новая</span>
                <input
                  v-model.trim="draft.name"
                  type="text"
                  class="draft-name-input"
                  maxlength="200"
                  placeholder="Название задачи"
                />
                <select v-model="draft.priority" class="draft-select" title="Приоритет">
                  <option value="HIGH">Высокий</option>
                  <option value="MIDDLE">Средний</option>
                  <option value="LOW">Низкий</option>
                </select>
                <button
                  type="button"
                  @click="removeTaskDraft(index)"
                  class="draft-remove-btn"
                  title="Убрать"
                  aria-label="Убрать"
                >
                  <AppIcon name="trash-2" :size="15" />
                </button>
              </div>
            </div>
            <div v-else class="link-empty">Добавьте новые задачи проекта.</div>
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
  </Teleport>
</template>

<script>
import { createProject, updateProject } from '../api/projects.js';
import { createWeeklyTask } from '../api/weeklyTasks.js';
import { createTask } from '../api/tasks.js';

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
    },
    prefillName: {
      type: String,
      default: ''
    }
  },

  emits: ['close', 'saved'],

  data() {
    return {
      form: {
        name: '',
        status: 'ACTIVE',
        priority: 'MIDDLE',
        dueDate: ''
      },
      newWeeklies: [],
      newTasks: [],
      itemKeyCounter: 0,
      saving: false
    };
  },

  computed: {
    isEdit() {
      return !!this.project;
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
    initForm() {
      if (this.project) {
        this.form = {
          name: this.project.name || '',
          status: this.project.status || 'ACTIVE',
          priority: this.project.priority || 'MIDDLE',
          dueDate: this.project.dueDate || ''
        };
      } else {
        this.form = {
          name: this.prefillName || '',
          status: 'ACTIVE',
          priority: 'MIDDLE',
          dueDate: ''
        };
      }
      this.newWeeklies = [];
      this.newTasks = [];
    },

    addWeeklyDraft() {
      this.newWeeklies.push({
        key: ++this.itemKeyCounter,
        name: '',
        count: 3,
        priority: 'MIDDLE',
        status: 'IN_PROGRESS'
      });
    },

    removeWeeklyDraft(index) {
      this.newWeeklies.splice(index, 1);
    },

    addTaskDraft() {
      this.newTasks.push({
        key: ++this.itemKeyCounter,
        name: '',
        priority: 'MIDDLE'
      });
    },

    removeTaskDraft(index) {
      this.newTasks.splice(index, 1);
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
            dueDate: this.form.dueDate || null
          });
        } else {
          response = await createProject(this.form);

          if (response.isSuccess && response.data?.id) {
            projectId = response.data.id;
          }
        }

        if (!response.isSuccess) {
          alert('Не удалось сохранить проект: ' + (response.errorMessage || 'Неизвестная ошибка'));
          return;
        }

        const errors = [];
        const newWeeklyIds = [];
        const newTaskIds = [];

        if (projectId) {
          const draftResult = await this.createDrafts(this.form.name);
          newWeeklyIds.push(...draftResult.weeklyIds);
          newTaskIds.push(...draftResult.taskIds);
          errors.push(...draftResult.errors);

          const weeklyIds = newWeeklyIds;
          const taskIds = newTaskIds;
          const needLink = newWeeklyIds.length > 0 || newTaskIds.length > 0;

          if (needLink) {
            response = await updateProject(projectId, {
              name: this.form.name,
              status: this.form.status,
              priority: this.form.priority,
              weeklyIds,
              taskIds
            });

            if (!response.isSuccess) {
              errors.push(`Не удалось привязать задачи к проекту: ${response.errorMessage || 'ошибка'}`);
            }
          }
        }

        if (errors.length > 0) {
          alert('Проект сохранён, но возникли ошибки:\n' + errors.join('\n'));
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

    async createDrafts(projectName) {
      const weeklyIds = [];
      const taskIds = [];
      const errors = [];

      for (const draft of this.newWeeklies) {
        if (!draft.name) {
          continue;
        }

        try {
          const res = await createWeeklyTask({
            name: draft.name,
            count: Number(draft.count) || 1,
            projectName,
            priority: draft.priority,
            status: draft.status
          });
          if (res.isSuccess) {
            if (res.data?.id) {
              weeklyIds.push(res.data.id);
            }
          } else {
            errors.push(`Не удалось создать еженедельную задачу «${draft.name}»: ${res.errorMessage || 'ошибка'}`);
          }
        } catch (err) {
          errors.push(`Ошибка при создании еженедельной задачи «${draft.name}»`);
        }
      }

      for (const draft of this.newTasks) {
        if (!draft.name) {
          continue;
        }

        try {
          const res = await createTask({
            name: draft.name,
            priority: draft.priority,
            projectName
          });
          if (res.isSuccess) {
            if (res.data?.id) {
              taskIds.push(res.data.id);
            }
          } else {
            errors.push(`Не удалось создать задачу «${draft.name}»: ${res.errorMessage || 'ошибка'}`);
          }
        } catch (err) {
          errors.push(`Ошибка при создании задачи «${draft.name}»`);
        }
      }

      return { weeklyIds, taskIds, errors };
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
  background-color: var(--overlay-scrim);
  backdrop-filter: blur(3px);
  display: flex;
  justify-content: center;
  align-items: center;
  overflow-y: auto;
  z-index: 1001;
  animation: screen-fade var(--transition-base);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background-color: var(--bg-secondary);
  border: 1px solid color-mix(in srgb, var(--neon-violet) 40%, var(--border-light));
  padding: 30px;
  border-radius: var(--radius-lg);
  max-width: 640px;
  width: 92%;
  max-height: 90vh;
  overflow-y: auto;
  margin: auto;
  box-shadow: var(--shadow-elevated), var(--glow-violet);
  animation: screen-rise var(--transition-slow);
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

.link-count{
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: 11px;
  background-color: var(--accent-primary);
  color: var(--on-neon);
  font-size: 12px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.link-empty {
  font-size: 13px;
  color: var(--text-muted);
  font-style: italic;
  padding: 8px 0;
}

/* Кнопки добавления и поля черновиков */
.add-draft-btn {
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

.add-draft-btn:hover {
  background-color: var(--bg-tertiary);
}

.draft-name-input{
  flex: 1;
  padding: 7px 10px;
  border: 1px solid var(--border-color);
  border-radius: 5px;
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  font-size: 13px;
  font-family: inherit;
}

.draft-name-input:focus{
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: var(--glow-cyan);
}

.draft-remove-btn {
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

.draft-remove-btn:hover {
  background-color: var(--accent-red-light);
}

/* Черновики новых задач */
.draft-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.draft-item {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  padding: 6px;
  border: 1px dashed var(--accent-primary);
  border-radius: 6px;
  background-color: var(--bg-tertiary);
}

.draft-badge{
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--accent-primary);
  background-color: var(--accent-blue-light);
  padding: 2px 6px;
  border-radius: 8px;
  flex-shrink: 0;
  font-family: var(--font-mono);
  letter-spacing: 0.05em;
}

.draft-item .draft-name-input {
  min-width: 140px;
  background-color: var(--bg-secondary);
}

.draft-count{
  width: 52px;
  padding: 7px 6px;
  border: 1px solid var(--border-color);
  border-radius: 5px;
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 13px;
  font-family: inherit;
  flex-shrink: 0;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.draft-select {
  padding: 7px 6px;
  border: 1px solid var(--border-color);
  border-radius: 5px;
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 12px;
  font-family: inherit;
  flex-shrink: 0;
}

.draft-count:focus,
.draft-select:focus {
  outline: none;
  border-color: var(--accent-primary);
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
  color: var(--on-neon);
}

.save-btn:hover:not(:disabled) {
  filter: brightness(1.12);
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
