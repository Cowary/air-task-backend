<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <h3>{{ isEdit ? 'Редактировать идею' : 'Создать новую идею' }}</h3>

        <form @submit.prevent="handleSave" class="idea-form">
          <div class="form-group">
            <label for="ideaName">Название идеи *</label>
            <input
              id="ideaName"
              v-model.trim="form.name"
              type="text"
              required
              maxlength="200"
              placeholder="Введите название идеи"
            />
          </div>

          <div v-if="isEdit && idea.createdTs" class="idea-created">
            <AppIcon name="clock" :size="14" />
            <span>Создано: {{ formatDate(idea.createdTs) }}</span>
          </div>

          <div class="form-group">
            <label for="ideaDescription">Описание</label>
            <textarea
              id="ideaDescription"
              v-model="form.description"
              placeholder="Опишите идею (опционально)"
              maxlength="10000"
              rows="5"
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
  </Teleport>
</template>

<script>
import { createIdea, updateIdea } from '../../api/ideas.js';

export default {
  name: 'IdeaFormModal',

  props: {
    visible: {
      type: Boolean,
      required: true
    },
    idea: {
      type: Object,
      default: null
    }
  },

  emits: ['close', 'saved'],

  data() {
    return {
      saving: false,
      form: {
        name: '',
        description: ''
      }
    };
  },

  computed: {
    isEdit() {
      return !!this.idea;
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
      this.form = {
        name: this.idea?.name || '',
        description: this.idea?.description || ''
      };
    },

    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) return '';
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },

    closeModal() {
      this.$emit('close');
    },

    async handleSave() {
      if (!this.form.name) {
        alert('Пожалуйста, заполните название идеи');
        return;
      }

      this.saving = true;

      try {
        const payload = {
          name: this.form.name,
          description: this.form.description
        };

        const response = this.isEdit
          ? await updateIdea(this.idea.id, payload)
          : await createIdea(payload);

        if (response.isSuccess) {
          this.$emit('saved', response.data);
          this.closeModal();
        } else {
          alert('Не удалось сохранить идею: ' + (response.errorMessage || 'Неизвестная ошибка'));
        }
      } catch (err) {
        alert('Ошибка при сохранении идеи');
        console.error('Ошибка сохранения идеи:', err);
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
  background-color: var(--overlay-scrim);
  backdrop-filter: blur(3px);
  display: flex;
  justify-content: center;
  align-items: center;
  overflow-y: auto;
  z-index: 1100;
  animation: screen-fade var(--transition-base);
}

.modal-content {
  background-color: var(--bg-secondary);
  border: 1px solid color-mix(in srgb, var(--neon-violet) 40%, var(--border-light));
  padding: 30px;
  border-radius: var(--radius-lg);
  max-width: 520px;
  width: 92%;
  max-height: 90vh;
  overflow-y: auto;
  margin: auto;
  box-shadow: var(--shadow-elevated), var(--glow-violet);
  animation: screen-rise var(--transition-slow);
}

.modal-content h3 {
  color: var(--text-primary);
  margin-bottom: 20px;
  text-align: center;
}

.idea-form {
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
.form-group textarea:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.form-group textarea {
  resize: vertical;
}

.idea-created {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.06em;
  color: var(--text-muted);
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
</style>
