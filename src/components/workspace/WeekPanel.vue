<template>
  <div class="week-panel">
    <!-- Панель действий -->
    <div class="week-toolbar">
      <button @click="openCreateWeekly" class="section-add-btn">
        <AppIcon name="plus" :size="15" /> Еженедельная задача
      </button>
    </div>

    <!-- Заголовок с прогрессом недели -->
    <div class="week-summary">
      <div class="week-summary-card">
        <div class="summary-progress">
          <div class="summary-progress-bar">
            <div class="summary-progress-fill" :style="{ width: overallPercentage }"></div>
          </div>
          <div class="summary-text">
            Неделя {{ weekNumber }}: выполнено {{ completedTotal }} из {{ totalRequired }} подходов
            <span class="summary-percent">({{ overallPercentage }})</span>
          </div>
        </div>
      </div>

      <div class="week-chips">
        <div class="chip chip-green">
          <span class="chip-value">{{ completedTasks.length }}</span>
          <span class="chip-label">выполнено</span>
        </div>
        <div class="chip chip-blue">
          <span class="chip-value">{{ incompleteTasks.length }}</span>
          <span class="chip-label">осталось</span>
        </div>
        <div class="chip chip-purple">
          <span class="chip-value">{{ completedTodayCount }}</span>
          <span class="chip-label">сегодня</span>
        </div>
      </div>
    </div>

    <!-- Секция невыполненных задач -->
    <div class="section">
      <div class="section-header">
        <h2><AppIcon name="hourglass" :size="22" /> Осталось выполнить</h2>
        <button
          v-if="incompleteTasks.length > 0"
          @click="completeTask"
          class="complete-btn"
          :disabled="!selectedTaskId || completing"
        >
          {{ completing ? 'Отправка...' : 'Отметить выполненной' }}
        </button>
      </div>

      <div v-if="incompleteTasks.length === 0" class="empty-message">
        <p>Все задачи на этой неделе выполнены! <AppIcon name="party-popper" :size="16" /></p>
      </div>

      <div v-else class="task-list">
        <div
          v-for="task in sortedIncomplete"
          :key="task.weeklyTaskId"
          class="task-card incomplete"
          :class="{ selected: selectedTaskId === task.weeklyTaskId }"
          @click="selectTask(task)"
        >
          <div class="task-card-main">
            <div class="task-card-top">
              <span class="task-project" v-if="task.projectName"><AppIcon name="folder" :size="16" /> {{ task.projectName }}</span>
              <span v-if="task.completedToday" class="today-badge"><AppIcon name="check" :size="14" /> сегодня</span>
            </div>

            <div class="task-name">{{ task.weeklyTaskName }}</div>

            <div class="task-progress">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: task.completionPercentage }"></div>
              </div>
              <span class="progress-text">
                {{ task.completedCount }} / {{ task.requiredCount }} ({{ task.completionPercentage }})
              </span>
            </div>

            <div v-if="selectedTaskId === task.weeklyTaskId" class="selected-indicator">
              <AppIcon name="check" :size="14" /> Выбрано — нажмите «Отметить выполненной»
            </div>
          </div>

          <div v-if="weeklyRef(task)" class="task-card-actions" @click.stop>
            <button @click="openEditWeekly(task)" class="action-btn edit-btn" title="Редактировать" aria-label="Редактировать"><AppIcon name="pencil" :size="15" /></button>
            <button @click="confirmDeleteWeekly(task)" class="action-btn delete-btn" title="Удалить" aria-label="Удалить"><AppIcon name="trash-2" :size="15" /></button>
          </div>
        </div>
      </div>
    </div>

    <!-- Секция выполненных задач -->
    <div class="section">
      <div class="section-header">
        <h2><AppIcon name="circle-check-big" :size="22" /> Выполнено на этой неделе</h2>
      </div>

      <div v-if="completedTasks.length === 0" class="empty-message">
        <p>Пока нет выполненных задач</p>
      </div>

      <div v-else class="task-list">
        <div
          v-for="task in sortedCompleted"
          :key="task.weeklyTaskId"
          class="task-card completed"
        >
          <div class="task-card-main">
            <div class="task-card-top">
              <span class="task-project" v-if="task.projectName"><AppIcon name="folder" :size="16" /> {{ task.projectName }}</span>
              <span v-if="task.completedToday" class="today-badge"><AppIcon name="check" :size="14" /> сегодня</span>
            </div>

            <div class="task-name">{{ task.weeklyTaskName }}</div>

            <div class="task-progress">
              <div class="progress-bar">
                <div class="progress-fill full" style="width: 100%"></div>
              </div>
              <span class="progress-text">
                {{ task.completedCount }} / {{ task.requiredCount }} (100%)
              </span>
            </div>
          </div>

          <div v-if="weeklyRef(task)" class="task-card-actions" @click.stop>
            <button @click="openEditWeekly(task)" class="action-btn edit-btn" title="Редактировать" aria-label="Редактировать"><AppIcon name="pencil" :size="15" /></button>
            <button @click="confirmDeleteWeekly(task)" class="action-btn delete-btn" title="Удалить" aria-label="Удалить"><AppIcon name="trash-2" :size="15" /></button>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно создания/редактирования еженедельной задачи -->
    <WeeklyTaskFormModal
      :visible="showWeeklyModal"
      :task="editingWeekly"
      :projects="projects"
      @close="closeWeeklyModal"
      @saved="handleWeeklySaved"
    />

    <!-- Модальное окно подтверждения удаления -->
    <Teleport to="body">
      <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
        <div class="modal-content modal-small" @click.stop>
          <h3>Подтверждение удаления</h3>
          <p>Вы уверены, что хотите удалить еженедельную задачу "{{ weeklyToDelete?.name }}"?</p>
          <div class="form-actions">
            <button @click="closeDeleteModal" class="cancel-btn">Отмена</button>
            <button @click="removeWeekly" class="delete-btn-confirm" :disabled="deleting">
              {{ deleting ? 'Удаление...' : 'Удалить' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script>
import { completeWeeklyTask, getAllWeeklyTasks, deleteWeeklyTask } from '../../api/weeklyTasks.js';
import WeeklyTaskFormModal from './WeeklyTaskFormModal.vue';

export default {
  name: 'WeekPanel',

  components: {
    WeeklyTaskFormModal
  },

  props: {
    statistics: {
      type: Object,
      default: null
    },
    projects: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    }
  },

  emits: ['changed'],

  data() {
    return {
      selectedTaskId: null,
      completing: false,
      weeklyTasks: [],
      showWeeklyModal: false,
      editingWeekly: null,
      showDeleteModal: false,
      weeklyToDelete: null,
      deleting: false
    };
  },

  computed: {
    completedTasks() {
      return this.statistics?.completedTasks || [];
    },

    incompleteTasks() {
      return this.statistics?.incompleteTasks || [];
    },

    weekNumber() {
      return this.statistics?.weekNumber || '—';
    },

    sortedIncomplete() {
      return [...this.incompleteTasks].sort((a, b) =>
        (a.projectName || '').localeCompare(b.projectName || '')
      );
    },

    sortedCompleted() {
      return [...this.completedTasks].sort((a, b) =>
        (a.projectName || '').localeCompare(b.projectName || '')
      );
    },

    completedTodayCount() {
      return this.completedTasks.filter(t => t.completedToday).length
        + this.incompleteTasks.filter(t => t.completedToday).length;
    },

    totalRequired() {
      const all = [...this.completedTasks, ...this.incompleteTasks];
      return all.reduce((sum, t) => sum + (t.requiredCount || 0), 0);
    },

    completedTotal() {
      const all = [...this.completedTasks, ...this.incompleteTasks];
      return all.reduce((sum, t) => sum + (t.completedCount || 0), 0);
    },

    overallPercentage() {
      if (this.totalRequired === 0) {
        return '0%';
      }
      return Math.round((this.completedTotal / this.totalRequired) * 100) + '%';
    },

    // Полные объекты еженедельных задач по id (статистика содержит только имя/счётчики)
    weeklyById() {
      const map = {};
      this.weeklyTasks.forEach(weekly => {
        if (weekly.id != null) {
          map[weekly.id] = weekly;
        }
      });
      return map;
    }
  },

  watch: {
    statistics() {
      // После обновления данных снимаем выделение, если задачи больше нет
      if (this.selectedTaskId && !this.incompleteTasks.some(t => t.weeklyTaskId === this.selectedTaskId)) {
        this.selectedTaskId = null;
      }
      // Синхронизируем полный список недельных задач (создание/изменение в других вкладках)
      this.loadWeeklyTasks();
    }
  },

  methods: {
    weeklyRef(task) {
      return this.weeklyById[task.weeklyTaskId] || null;
    },

    async loadWeeklyTasks() {
      try {
        const response = await getAllWeeklyTasks(['IN_PROGRESS']);

        if (response.isSuccess) {
          this.weeklyTasks = response.data || [];
        } else {
          console.error('Ошибка загрузки недельных задач:', response.errorMessage);
        }
      } catch (err) {
        console.error('Ошибка загрузки недельных задач:', err);
      }
    },

    openCreateWeekly() {
      this.editingWeekly = null;
      this.showWeeklyModal = true;
    },

    openEditWeekly(task) {
      const weekly = this.weeklyRef(task);

      if (!weekly) {
        return;
      }

      this.editingWeekly = weekly;
      this.showWeeklyModal = true;
    },

    closeWeeklyModal() {
      this.showWeeklyModal = false;
      this.editingWeekly = null;
    },

    handleWeeklySaved() {
      this.loadWeeklyTasks();
      this.$emit('changed');
    },

    confirmDeleteWeekly(task) {
      const weekly = this.weeklyRef(task);

      if (!weekly) {
        return;
      }

      this.weeklyToDelete = weekly;
      this.showDeleteModal = true;
    },

    closeDeleteModal() {
      this.showDeleteModal = false;
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
          this.closeDeleteModal();
          this.loadWeeklyTasks();
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

    selectTask(task) {
      this.selectedTaskId = this.selectedTaskId === task.weeklyTaskId
        ? null
        : task.weeklyTaskId;
    },

    async completeTask() {
      if (!this.selectedTaskId) {
        return;
      }

      this.completing = true;

      try {
        const response = await completeWeeklyTask(this.selectedTaskId);

        if (response.isSuccess) {
          this.selectedTaskId = null;
          this.$emit('changed');
        } else {
          alert('Не удалось отметить задачу: ' + (response.errorMessage || 'Неизвестная ошибка'));
        }
      } catch (err) {
        alert('Ошибка при отправке данных');
        console.error('Ошибка отметки еженедельной задачи:', err);
      } finally {
        this.completing = false;
      }
    }
  },

  mounted() {
    this.loadWeeklyTasks();
  }
};
</script>

<style scoped>
.week-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.week-toolbar {
  display: flex;
  justify-content: flex-end;
}

.section-add-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
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

.week-summary {
  display: flex;
  gap: 15px;
  align-items: stretch;
  flex-wrap: wrap;
}

.week-summary-card{
  flex: 1;
  min-width: 260px;
  padding: 16px 20px;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  border-left: 3px solid var(--entity-weekly);
}

.summary-progress {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-progress-bar {
  height: 12px;
  background-color: var(--bg-tertiary);
  border-radius: 6px;
  overflow: hidden;
}

.summary-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-green), var(--neon-cyan));
  border-radius: 6px;
  transition: width 0.4s ease;
}

.summary-text {
  font-size: 14px;
  color: var(--text-secondary);
}

.summary-percent {
  font-weight: 700;
  color: var(--accent-green);
}

.week-chips {
  display: flex;
  gap: 10px;
}

.chip{
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px 18px;
  border-radius: 10px;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  min-width: 80px;
  font-family: var(--font-mono);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.chip-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

.chip-label {
  font-size: 11px;
  color: var(--text-secondary);
}

.chip-green {
  border-top: 3px solid var(--accent-green);
}

.chip-blue {
  border-top: 3px solid var(--accent-blue);
}

.chip-purple {
  border-top: 3px solid var(--accent-purple);
}

.section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.section-header h2 {
  color: var(--text-primary);
  font-size: 17px;
  margin: 0;
}

.complete-btn {
  padding: 9px 18px;
  background-color: var(--accent-green);
  color: var(--on-neon);
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.complete-btn:hover:not(:disabled) {
  filter: brightness(1.08);
}

.complete-btn:disabled {
  background-color: var(--text-muted);
  cursor: not-allowed;
  opacity: 0.7;
}

.empty-message {
  text-align: center;
  padding: 25px;
  color: var(--text-muted);
  background-color: var(--bg-tertiary);
  border-radius: 8px;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.task-card{
  padding: 14px 16px;
  border-radius: var(--radius-md);
  background-color: var(--bg-secondary);
  border: 2px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s ease;
  border-left: 3px solid var(--entity-weekly);
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.task-card-main {
  flex: 1;
  min-width: 0;
}

.task-card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
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

.task-card.incomplete:hover {
  border-color: var(--accent-blue);
  box-shadow: 0 3px 10px var(--shadow-color);
}

.task-card.incomplete.selected {
  border-color: var(--accent-green);
  background-color: var(--accent-green-light);
}

.task-card.completed {
  cursor: default;
  border-color: var(--accent-green);
  opacity: 0.9;
}

.task-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}

.task-project {
  font-size: 12px;
  color: var(--text-secondary);
}

.today-badge{
  font-size: 11px;
  font-weight: 600;
  color: var(--accent-green);
  background-color: var(--accent-green-light);
  padding: 2px 10px;
  border-radius: 10px;
  white-space: nowrap;
  font-family: var(--font-mono);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  border: 1px solid color-mix(in srgb, currentColor 45%, transparent);
}

.task-name {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 10px;
  word-break: break-word;
}

.task-card.completed .task-name {
  text-decoration: line-through;
  color: var(--text-secondary);
}

.task-progress {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  flex: 1;
  height: 10px;
  background-color: var(--bg-tertiary);
  border-radius: 5px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--neon-violet), var(--neon-cyan));
  border-radius: 5px;
  transition: width 0.4s ease;
}

.progress-fill.full {
  background: linear-gradient(90deg, var(--accent-green), var(--neon-cyan));
}

.progress-text {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
}

.selected-indicator {
  margin-top: 10px;
  font-size: 12px;
  font-weight: 600;
  color: var(--accent-green);
}

/* Модальные окна подтверждения */
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
  max-width: 400px;
  width: 90%;
  box-shadow: var(--shadow-elevated), var(--glow-violet);
  animation: screen-rise var(--transition-slow);
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
  color: var(--on-neon);
}

.delete-btn-confirm:hover:not(:disabled) {
  filter: brightness(1.12);
}

.delete-btn-confirm:disabled {
  background-color: var(--text-muted);
  cursor: not-allowed;
}
</style>
