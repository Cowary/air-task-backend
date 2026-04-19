<template>
  <div v-if="visible" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <h3>Создать новый проект</h3>

      <form @submit.prevent="handleCreateProject" class="project-form">
        <div class="form-group">
          <label for="projectName">Название проекта *</label>
          <input
            id="projectName"
            v-model.trim="projectForm.name"
            type="text"
            required
            maxlength="100"
            placeholder="Введите название проекта"
          />
        </div>

        <div class="form-group">
          <label for="projectStatus">Статус</label>
          <select
            id="projectStatus"
            v-model="projectForm.status"
          >
            <option value="ACTIVE">Активный</option>
            <option value="COMPLETED">Завершён</option>
            <option value="ARCHIVED">Архивирован</option>
          </select>
        </div>

        <div class="form-group">
          <label for="projectPriority">Приоритет</label>
          <select
            id="projectPriority"
            v-model="projectForm.priority"
          >
            <option value="HIGH">Высокий</option>
            <option value="MIDDLE">Средний</option>
            <option value="LOW">Низкий</option>
          </select>
        </div>

        <div class="form-actions">
          <button type="button" @click="closeModal" class="cancel-btn">Отмена</button>
          <button type="submit" class="save-btn" :disabled="saving">
            {{ saving ? 'Создание...' : 'Создать' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProjectModal',

  props: {
    visible: {
      type: Boolean,
      required: true
    },
    createProject: {
      type: Function,
      required: true
    },
    onProjectCreated: {
      type: Function,
      required: true
    }
  },

  data() {
    return {
      projectForm: {
        name: '',
        status: 'ACTIVE',
        priority: 'MIDDLE'
      },
      saving: false
    };
  },

  methods: {
    closeModal() {
      this.projectForm = {
        name: '',
        status: 'ACTIVE',
        priority: 'MIDDLE'
      };
      this.$emit('close');
    },

    async handleCreateProject() {
      if (!this.projectForm.name) {
        alert('Пожалуйста, введите название проекта');
        return;
      }

      this.saving = true;

      try {
        const response = await this.createProject(this.projectForm);

        if (response.isSuccess) {
          this.onProjectCreated(response.data);
          this.closeModal();
        } else {
          alert('Не удалось создать проект: ' + (response.errorMessage || 'Неизвестная ошибка'));
        }
      } catch (err) {
        alert('Ошибка при создании проекта');
        console.error('Ошибка создания проекта:', err);
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
  max-width: 450px;
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

.project-form {
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
</style>
