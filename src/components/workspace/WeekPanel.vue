<template>
  <div class="week-panel">
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
        <h2>⏳ Осталось выполнить</h2>
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
        <p>Все задачи на этой неделе выполнены! 🎉</p>
      </div>

      <div v-else class="task-list">
        <div
          v-for="task in sortedIncomplete"
          :key="task.weeklyTaskId"
          class="task-card incomplete"
          :class="{ selected: selectedTaskId === task.weeklyTaskId }"
          @click="selectTask(task)"
        >
          <div class="task-card-top">
            <span class="task-project" v-if="task.projectName">📁 {{ task.projectName }}</span>
            <span v-if="task.completedToday" class="today-badge">✓ сегодня</span>
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
            ✓ Выбрано — нажмите «Отметить выполненной»
          </div>
        </div>
      </div>
    </div>

    <!-- Секция выполненных задач -->
    <div class="section">
      <div class="section-header">
        <h2>✅ Выполнено на этой неделе</h2>
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
          <div class="task-card-top">
            <span class="task-project" v-if="task.projectName">📁 {{ task.projectName }}</span>
            <span v-if="task.completedToday" class="today-badge">✓ сегодня</span>
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
      </div>
    </div>
  </div>
</template>

<script>
import { completeWeeklyTask } from '../../api/weeklyTasks.js';

export default {
  name: 'WeekPanel',

  props: {
    statistics: {
      type: Object,
      default: null
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
      completing: false
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
    }
  },

  watch: {
    statistics() {
      // После обновления данных снимаем выделение, если задачи больше нет
      if (this.selectedTaskId && !this.incompleteTasks.some(t => t.weeklyTaskId === this.selectedTaskId)) {
        this.selectedTaskId = null;
      }
    }
  },

  methods: {
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
  }
};
</script>

<style scoped>
.week-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.week-summary {
  display: flex;
  gap: 15px;
  align-items: stretch;
  flex-wrap: wrap;
}

.week-summary-card {
  flex: 1;
  min-width: 260px;
  padding: 16px 20px;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  display: flex;
  align-items: center;
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
  background: linear-gradient(90deg, var(--accent-green), #7ed957);
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

.chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px 18px;
  border-radius: 10px;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  min-width: 80px;
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
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.complete-btn:hover:not(:disabled) {
  background-color: #3d8b40;
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

.task-card {
  padding: 14px 16px;
  border-radius: 10px;
  background-color: var(--bg-secondary);
  border: 2px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s ease;
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

.today-badge {
  font-size: 11px;
  font-weight: 600;
  color: var(--accent-green);
  background-color: var(--accent-green-light);
  padding: 2px 10px;
  border-radius: 10px;
  white-space: nowrap;
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
  background: linear-gradient(90deg, var(--accent-blue), var(--accent-primary));
  border-radius: 5px;
  transition: width 0.4s ease;
}

.progress-fill.full {
  background: linear-gradient(90deg, var(--accent-green), #7ed957);
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
</style>
