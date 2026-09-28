<template>
  <div class="kanban-panel">
    <!-- Шапка: диапазон текущей недели -->
    <header class="kanban-head">
      <div class="week-range">
        <AppIcon name="calendar-days" :size="16" />
        <span class="week-range-label">Неделя:</span>
        <span class="week-range-dates">с {{ formatDateOnly(weekStart) }} по {{ formatDateOnly(weekEnd) }}</span>
      </div>
      <div class="kanban-legend">
        <span class="legend-item legend-project-task"><span class="legend-dot"></span>Проект</span>
        <span class="legend-item legend-plain-task"><span class="legend-dot"></span>Без проекта</span>
        <span class="legend-item legend-weekly"><span class="legend-dot"></span>Weekly</span>
        <span class="legend-item legend-reminder"><span class="legend-dot"></span>Напоминания</span>
      </div>
    </header>

    <div v-if="loading" class="kanban-state">
      <div class="spinner"></div>
      <span>Загрузка...</span>
    </div>

    <div v-else-if="error" class="kanban-state error-block">
      <span>{{ error }}</span>
      <button class="retry-btn" @click="loadOwn">Повторить</button>
    </div>

    <div v-else class="kanban-board">
      <section
        v-for="column in columns"
        :key="column.key"
        class="kanban-column"
        :class="`column-${column.key}`"
      >
        <header class="column-head">
          <span class="column-title">{{ column.label }}</span>
          <span class="column-count">{{ column.cards.length }}</span>
        </header>

        <div v-if="column.cards.length === 0" class="column-empty">
          Пусто
        </div>

        <ul v-else class="column-list">
          <li
            v-for="card in column.cards"
            :key="card.key"
            class="kanban-card"
            :class="`card-${card.variant}`"
          >
            <button type="button" class="card-button" @click="openCard(card)">
              <div class="card-top">
                <span class="card-type">
                  <AppIcon :name="typeIcon(card.variant)" :size="14" />
                  <span class="card-type-label">{{ typeLabel(card) }}</span>
                </span>
                <span
                  v-if="card.priority"
                  class="card-priority"
                  :class="`priority-${String(card.priority).toLowerCase()}`"
                >
                  {{ priorityLabel(card.priority) }}
                </span>
              </div>

              <div class="card-title">{{ card.title }}</div>

              <div class="card-meta">
                <span class="card-date">
                  <AppIcon name="calendar-clock" :size="13" />
                  {{ dateLabel(card) }}
                </span>
                <span v-if="card.kind === 'weekly'" class="card-note">до конца недели</span>
              </div>
            </button>
          </li>
        </ul>
      </section>
    </div>

    <TaskFormModal
      :visible="showTaskModal"
      :task="editingTask"
      :projects="projects"
      @close="showTaskModal = false"
      @saved="handleSaved"
    />

    <WeeklyTaskFormModal
      :visible="showWeeklyModal"
      :task="editingWeekly"
      :projects="projects"
      @close="showWeeklyModal = false"
      @saved="handleSaved"
    />

    <ReminderFormModal
      :visible="showReminderModal"
      :reminder="editingReminder"
      @close="showReminderModal = false"
      @saved="handleSaved"
    />
  </div>
</template>

<script>
import { getAllWeeklyTasks } from '../../api/weeklyTasks.js';
import { getAllReminders } from '../../api/reminders.js';
import { useSettings, loadSettings } from '../../store/settings.js';
import { isoOf, weekRange } from '../../utils/week.js';
import TaskFormModal from './TaskFormModal.vue';
import WeeklyTaskFormModal from './WeeklyTaskFormModal.vue';
import ReminderFormModal from './ReminderFormModal.vue';

const NO_PROJECT_LABEL = 'Без проекта';

export const KANBAN_COLUMNS = [
  { key: 'overdue', label: 'Просрочено' },
  { key: 'today', label: 'Сегодня' },
  { key: 'tomorrow', label: 'Завтра' },
  { key: 'week', label: 'На этой неделе' },
  { key: 'month', label: 'В этом месяце' }
];

export default {
  name: 'KanbanBoardPanel',

  components: {
    TaskFormModal,
    WeeklyTaskFormModal,
    ReminderFormModal
  },

  props: {
    projects: {
      type: Array,
      default: () => []
    },
    tasks: {
      type: Array,
      default: () => []
    }
  },

  emits: ['changed'],

  data() {
    return {
      weeklyTasks: [],
      reminders: [],
      loading: false,
      error: null,
      showTaskModal: false,
      editingTask: null,
      showWeeklyModal: false,
      editingWeekly: null,
      showReminderModal: false,
      editingReminder: null
    };
  },

  computed: {
    firstDayOfWeek() {
      return useSettings().firstDayOfWeek;
    },

    today() {
      return isoOf(new Date());
    },

    tomorrow() {
      const now = new Date();
      return isoOf(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
    },

    weekStart() {
      return weekRange(new Date(), this.firstDayOfWeek).start;
    },

    weekEnd() {
      return weekRange(new Date(), this.firstDayOfWeek).end;
    },

    monthEnd() {
      const now = new Date();
      return isoOf(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    },

    allCards() {
      const cards = [];

      (this.tasks || []).forEach(task => {
        if (task.isComplete || !task.dueDate) return;
        const name = task.project?.name;
        const hasProject = !!name;
        cards.push({
          key: `task-${task.id}`,
          kind: 'task',
          variant: hasProject ? 'project-task' : 'plain-task',
          title: task.name,
          date: task.dueDate,
          projectName: hasProject ? name : '',
          priority: task.priority,
          ref: task
        });
      });

      (this.weeklyTasks || []).forEach(weekly => {
        cards.push({
          key: `weekly-${weekly.id}`,
          kind: 'weekly',
          variant: 'weekly',
          title: weekly.name,
          date: this.weekEnd,
          projectName: weekly.project?.name || '',
          priority: weekly.priority,
          ref: weekly
        });
      });

      (this.reminders || []).forEach(reminder => {
        cards.push({
          key: `reminder-${reminder.id}`,
          kind: 'reminder',
          variant: 'reminder',
          title: reminder.name,
          date: reminder.nextDueDate,
          projectName: '',
          priority: null,
          ref: reminder
        });
      });

      return cards.filter(card => this.columnForCard(card) !== null);
    },

    columns() {
      const groups = { overdue: [], today: [], tomorrow: [], week: [], month: [] };
      this.allCards.forEach(card => {
        groups[this.columnForCard(card)].push(card);
      });

      const byDateThenTitle = (a, b) =>
        String(a.date).localeCompare(String(b.date)) ||
        String(a.title || '').localeCompare(String(b.title || ''), 'ru');

      return KANBAN_COLUMNS.map(column => ({
        ...column,
        cards: groups[column.key].sort(byDateThenTitle)
      }));
    }
  },

  methods: {
    columnFor(dateStr) {
      if (!dateStr) return null;
      const key = String(dateStr).split('T')[0];
      if (key < this.today) return 'overdue';
      if (key === this.today) return 'today';
      if (key === this.tomorrow) return 'tomorrow';
      if (key <= this.weekEnd) return 'week';
      if (key <= this.monthEnd) return 'month';
      return null;
    },

    columnForCard(card) {
      if (card.kind === 'weekly') return 'week';
      return this.columnFor(card.date);
    },

    formatDateOnly(dateString) {
      if (!dateString) return '';
      const [year, month, day] = String(dateString).split('T')[0].split('-');
      if (!year || !month || !day) return dateString;
      return `${day}.${month}.${year}`;
    },

    dateLabel(card) {
      return this.formatDateOnly(card.date);
    },

    typeIcon(variant) {
      switch (variant) {
        case 'project-task':
          return 'folder';
        case 'plain-task':
          return 'list-checks';
        case 'weekly':
          return 'repeat';
        default:
          return 'bell';
      }
    },

    typeLabel(card) {
      if (card.projectName) return card.projectName;
      if (card.variant === 'plain-task') return NO_PROJECT_LABEL;
      if (card.variant === 'reminder') return 'Напоминание';
      return '';
    },

    priorityLabel(priority) {
      const labels = {
        HIGH: 'Высокий',
        MIDDLE: 'Средний',
        MEDIUM: 'Средний',
        LOW: 'Низкий'
      };
      return labels[priority] || priority;
    },

    openCard(card) {
      if (card.kind === 'task') {
        this.editingTask = card.ref;
        this.showTaskModal = true;
      } else if (card.kind === 'weekly') {
        this.editingWeekly = card.ref;
        this.showWeeklyModal = true;
      } else {
        this.editingReminder = card.ref;
        this.showReminderModal = true;
      }
    },

    handleSaved() {
      this.loadOwn();
      this.$emit('changed');
    },

    async loadOwn() {
      this.loading = true;
      this.error = null;
      try {
        const [weeklyRes, remindersRes] = await Promise.all([
          getAllWeeklyTasks(['IN_PROGRESS', 'PAUSED']),
          getAllReminders()
        ]);

        let hasError = false;

        if (weeklyRes.isSuccess) {
          this.weeklyTasks = weeklyRes.data || [];
        } else {
          hasError = true;
          console.error('Ошибка загрузки недельных задач:', weeklyRes.errorMessage);
        }

        if (remindersRes.isSuccess) {
          this.reminders = (remindersRes.data || []).filter(
            reminder => !reminder.deleted && !reminder.resolved
          );
        } else {
          hasError = true;
          console.error('Ошибка загрузки напоминаний:', remindersRes.errorMessage);
        }

        if (hasError) {
          this.error = 'Не удалось загрузить часть данных доски.';
        }
      } catch (err) {
        console.error('Ошибка загрузки данных канбана:', err);
        this.error = 'Не удалось загрузить данные доски.';
      } finally {
        this.loading = false;
      }
    }
  },

  mounted() {
    loadSettings();
    this.loadOwn();
  }
};
</script>

<style scoped>
.kanban-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.kanban-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 12px 16px;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-left: 3px solid var(--neon-cyan);
  border-radius: var(--radius-md);
}

.week-range {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--text-secondary);
}

.week-range-label {
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 11px;
}

.week-range-dates {
  color: var(--neon-cyan);
  font-weight: 600;
}

.kanban-legend {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 12px;
  color: var(--text-muted);
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: currentColor;
  box-shadow: 0 0 8px currentColor;
}

.legend-project-task {
  color: var(--entity-project);
}

.legend-plain-task {
  color: var(--entity-task);
}

.legend-weekly {
  color: var(--entity-weekly);
}

.legend-reminder {
  color: var(--entity-reminder);
}

.kanban-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 40px 20px;
  color: var(--text-muted);
  background-color: var(--bg-secondary);
  border: 1px dashed var(--border-color);
  border-radius: var(--radius-md);
}

.error-block {
  color: var(--neon-red);
  border-color: var(--accent-red);
}

.spinner {
  border: 3px solid var(--spinner-bg);
  border-top: 3px solid var(--accent-primary);
  border-radius: 50%;
  width: 28px;
  height: 28px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.retry-btn {
  padding: 8px 16px;
  background-color: var(--accent-primary);
  color: var(--on-neon);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.kanban-board {
  display: grid;
  grid-template-columns: repeat(5, minmax(240px, 1fr));
  gap: 14px;
  align-items: start;
  overflow-x: auto;
}

.kanban-column {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  min-width: 240px;
}

.column-overdue { border-top: 3px solid var(--neon-red); }
.column-today { border-top: 3px solid var(--neon-amber); }
.column-tomorrow { border-top: 3px solid var(--neon-green); }
.column-week { border-top: 3px solid var(--neon-cyan); }
.column-month { border-top: 3px solid var(--neon-violet); }

.column-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.column-title {
  font-family: var(--font-display);
  font-size: 0.98rem;
  font-weight: 600;
  color: var(--text-primary);
}

.column-count {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-muted);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 1px 8px;
}

.column-empty {
  padding: 14px 8px;
  text-align: center;
  font-size: 12.5px;
  color: var(--text-muted);
  border: 1px dashed var(--border-color);
  border-radius: var(--radius-sm);
}

.column-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.kanban-card {
  border-radius: var(--radius-sm);
  transition: box-shadow var(--transition-base), border-color var(--transition-base);
}

.card-project-task {
  border-left: 3px solid var(--entity-project);
  background-color: color-mix(in srgb, var(--entity-project) 10%, var(--bg-secondary));
}

.card-plain-task {
  border-left: 3px solid var(--entity-task);
  background-color: color-mix(in srgb, var(--entity-task) 10%, var(--bg-secondary));
}

.card-weekly {
  border-left: 3px solid var(--entity-weekly);
  background-color: color-mix(in srgb, var(--entity-weekly) 10%, var(--bg-secondary));
}

.card-reminder {
  border-left: 3px solid var(--entity-reminder);
  background-color: color-mix(in srgb, var(--entity-reminder) 10%, var(--bg-secondary));
}

.kanban-card:hover {
  box-shadow: 0 0 0 1px var(--border-light), 0 0 14px var(--shadow-color);
}

.card-button {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  padding: 10px 12px;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  text-align: left;
  cursor: pointer;
  color: inherit;
  font: inherit;
}

.card-button:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.card-type {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  font-size: 11px;
  color: var(--text-secondary);
}

.card-project-task .card-type { color: var(--entity-project); }
.card-plain-task .card-type { color: var(--entity-task); }
.card-weekly .card-type { color: var(--entity-weekly); }
.card-reminder .card-type { color: var(--entity-reminder); }

.card-type-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-priority {
  flex-shrink: 0;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 10px;
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

.card-title {
  font-size: 13.5px;
  font-weight: 500;
  color: var(--text-primary);
  word-break: break-word;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.card-date {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-muted);
}

.card-note {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

@media (max-width: 900px) {
  .kanban-board {
    grid-template-columns: repeat(2, minmax(220px, 1fr));
  }
}

@media (max-width: 600px) {
  .kanban-board {
    grid-template-columns: 1fr;
  }

  .kanban-legend {
    display: none;
  }
}
</style>
