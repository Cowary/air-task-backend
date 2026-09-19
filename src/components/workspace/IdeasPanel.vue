<template>
  <div class="ideas-panel">
    <div class="ideas-toolbar">
      <div class="ideas-title">
        <AppIcon name="lightbulb" :size="18" />
        <span>Идеи</span>
        <span class="ideas-count">{{ ideas.length }}</span>
      </div>
      <button class="create-btn" @click="openCreateModal">
        <AppIcon name="plus" :size="16" />
        <span>Новая идея</span>
      </button>
    </div>

    <div v-if="ideas.length === 0" class="ideas-empty">
      Идей пока нет. Запишите первую идею!
    </div>

    <div v-else class="ideas-list">
      <article v-for="idea in ideas" :key="idea.id" class="idea-card">
        <h3 class="idea-name">{{ idea.name }}</h3>

        <p v-if="idea.description" class="idea-description">{{ idea.description }}</p>

        <div class="idea-created">
          <AppIcon name="clock" :size="13" />
          <span>Создано: {{ formatDate(idea.createdTs) }}</span>
        </div>

        <div class="idea-actions">
          <button
            class="action-btn"
            title="В задачу"
            aria-label="Превратить идею в задачу"
            @click="convertToTask(idea)"
          >
            <AppIcon name="list-plus" :size="15" />
            <span class="action-label">В задачу</span>
          </button>
          <button
            class="action-btn"
            title="В проект"
            aria-label="Превратить идею в проект"
            @click="convertToProject(idea)"
          >
            <AppIcon name="folder-plus" :size="15" />
            <span class="action-label">В проект</span>
          </button>
          <button
            class="action-btn"
            title="Редактировать"
            aria-label="Редактировать идею"
            @click="openEditModal(idea)"
          >
            <AppIcon name="pencil" :size="15" />
          </button>
          <button
            class="action-btn danger"
            title="Удалить"
            aria-label="Удалить идею"
            @click="openDeleteModal(idea)"
          >
            <AppIcon name="trash-2" :size="15" />
          </button>
        </div>
      </article>
    </div>

    <IdeaFormModal
      :visible="showIdeaModal"
      :idea="editingIdea"
      @close="closeIdeaModal"
      @saved="handleIdeaSaved"
    />

    <Teleport to="body">
      <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
        <div class="modal-content modal-small" @click.stop>
          <h3>Подтверждение удаления</h3>
          <p>Вы уверены, что хотите удалить идею "{{ ideaToDelete?.name }}"?</p>
          <div class="form-actions">
            <button @click="closeDeleteModal" class="cancel-btn">Отмена</button>
            <button @click="confirmDelete" class="delete-btn-confirm" :disabled="deleting">
              {{ deleting ? 'Удаление...' : 'Удалить' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <TaskFormModal
      :visible="showConvertTaskModal"
      :task="null"
      :projects="projects"
      :prefill-name="ideaToConvert?.name || ''"
      :prefill-description="ideaToConvert?.description || ''"
      @close="closeConvertTaskModal"
      @saved="handleConverted"
    />

    <ProjectFormModal
      :visible="showConvertProjectModal"
      :project="null"
      :prefill-name="ideaToConvert?.name || ''"
      @close="closeConvertProjectModal"
      @saved="handleConverted"
    />
  </div>
</template>

<script>
import { deleteIdea } from '../../api/ideas.js';
import IdeaFormModal from './IdeaFormModal.vue';
import TaskFormModal from './TaskFormModal.vue';
import ProjectFormModal from '../../components/ProjectFormModal.vue';

export default {
  name: 'IdeasPanel',

  components: {
    IdeaFormModal,
    TaskFormModal,
    ProjectFormModal
  },

  props: {
    ideas: {
      type: Array,
      default: () => []
    },
    projects: {
      type: Array,
      default: () => []
    }
  },

  emits: ['changed'],

  data() {
    return {
      showIdeaModal: false,
      editingIdea: null,

      showDeleteModal: false,
      ideaToDelete: null,
      deleting: false,

      showConvertTaskModal: false,
      showConvertProjectModal: false,
      ideaToConvert: null
    };
  },

  methods: {
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

    openCreateModal() {
      this.editingIdea = null;
      this.showIdeaModal = true;
    },

    openEditModal(idea) {
      this.editingIdea = idea;
      this.showIdeaModal = true;
    },

    closeIdeaModal() {
      this.showIdeaModal = false;
      this.editingIdea = null;
    },

    handleIdeaSaved() {
      this.$emit('changed');
    },

    openDeleteModal(idea) {
      this.ideaToDelete = idea;
      this.showDeleteModal = true;
    },

    closeDeleteModal() {
      this.showDeleteModal = false;
      this.ideaToDelete = null;
    },

    async confirmDelete() {
      if (!this.ideaToDelete) return;

      this.deleting = true;
      try {
        const response = await deleteIdea(this.ideaToDelete.id);
        if (response.isSuccess) {
          this.closeDeleteModal();
          this.$emit('changed');
        } else {
          alert('Не удалось удалить идею: ' + (response.errorMessage || 'Неизвестная ошибка'));
        }
      } catch (err) {
        alert('Ошибка при удалении идеи');
        console.error('Ошибка удаления идеи:', err);
      } finally {
        this.deleting = false;
      }
    },

    convertToTask(idea) {
      this.ideaToConvert = idea;
      this.showConvertTaskModal = true;
    },

    closeConvertTaskModal() {
      this.showConvertTaskModal = false;
      this.ideaToConvert = null;
    },

    convertToProject(idea) {
      this.ideaToConvert = idea;
      this.showConvertProjectModal = true;
    },

    closeConvertProjectModal() {
      this.showConvertProjectModal = false;
      this.ideaToConvert = null;
    },

    async handleConverted() {
      const idea = this.ideaToConvert;
      this.showConvertTaskModal = false;
      this.showConvertProjectModal = false;
      this.ideaToConvert = null;

      if (!idea) {
        this.$emit('changed');
        return;
      }

      try {
        const response = await deleteIdea(idea.id);
        if (!response.isSuccess) {
          alert('Сущность создана, но не удалось удалить исходную идею: '
            + (response.errorMessage || 'Неизвестная ошибка'));
        }
      } catch (err) {
        alert('Сущность создана, но не удалось удалить исходную идею');
        console.error('Ошибка удаления идеи после конвертации:', err);
      } finally {
        this.$emit('changed');
      }
    }
  }
};
</script>

<style scoped>
.ideas-panel {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.ideas-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
}

.ideas-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.ideas-count {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--neon-cyan);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 2px 8px;
}

.create-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background-color: var(--accent-primary);
  color: var(--on-neon);
  border: none;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: filter var(--transition-base), box-shadow var(--transition-base);
}

.create-btn:hover {
  filter: brightness(1.1);
  box-shadow: var(--glow-cyan);
}

.ideas-empty {
  text-align: center;
  padding: 46px 20px;
  color: var(--text-muted);
  background-color: var(--bg-secondary);
  border: 1px dashed var(--border-color);
  border-radius: var(--radius-md);
}

.ideas-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.idea-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-left: 3px solid var(--entity-idea);
  border-radius: var(--radius-md);
  transition: border-color var(--transition-base), box-shadow var(--transition-base);
}

.idea-card:hover {
  border-color: color-mix(in srgb, var(--neon-violet) 45%, var(--border-light));
  box-shadow: var(--glow-violet);
}

.idea-name {
  margin: 0;
  font-size: 1.05rem;
  color: var(--text-primary);
  word-break: break-word;
}

.idea-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 8px;
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-family: var(--font-mono);
  cursor: pointer;
  transition: color var(--transition-base), background-color var(--transition-base),
    border-color var(--transition-base);
}

.action-btn:hover {
  color: var(--neon-cyan);
  background-color: var(--bg-tertiary);
  border-color: var(--border-light);
}

.action-btn.danger:hover {
  color: var(--neon-red);
}

.idea-description {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.92rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.idea-created {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: auto;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

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
  box-shadow: var(--shadow-elevated), var(--glow-violet);
}

.modal-small {
  max-width: 420px;
}

.modal-content h3 {
  color: var(--text-primary);
  margin-bottom: 16px;
  text-align: center;
}

.modal-content p {
  color: var(--text-secondary);
  text-align: center;
  margin: 0 0 8px;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 18px;
}

.cancel-btn,
.delete-btn-confirm {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
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
  color: var(--on-neon);
}

.delete-btn-confirm:hover:not(:disabled) {
  filter: brightness(1.12);
}

.delete-btn-confirm:disabled {
  background-color: var(--text-muted);
  cursor: not-allowed;
}

@media (max-width: 600px) {
  .action-label {
    display: none;
  }

  .ideas-list {
    grid-template-columns: 1fr;
  }
}
</style>
