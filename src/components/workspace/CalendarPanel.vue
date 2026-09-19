<template>
  <div class="calendar-panel">
    <div class="calendar-toolbar">
      <div class="calendar-nav">
        <button class="nav-btn" aria-label="Предыдущий месяц" @click="prevMonth">
          <AppIcon name="chevron-left" :size="18" />
        </button>
        <span class="calendar-month">{{ monthLabel }}</span>
        <button class="nav-btn" aria-label="Следующий месяц" @click="nextMonth">
          <AppIcon name="chevron-right" :size="18" />
        </button>
        <button class="today-btn" @click="goToday">Сегодня</button>
      </div>
      <div class="calendar-filters">
        <button
          v-for="option in filterOptions"
          :key="option.type"
          class="filter-chip"
          :class="[`filter-chip--${option.type}`, { active: filters[option.type] }]"
          @click="toggleFilter(option.type)"
        >
          <span class="filter-dot" :class="`dot-${option.type}`"></span>
          {{ option.label }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="calendar-state">
      <div class="spinner"></div>
      <span>Загрузка...</span>
    </div>

    <div v-else-if="error" class="calendar-state error-block">
      <span>{{ error }}</span>
      <button class="retry-btn" @click="loadMonth">Повторить</button>
    </div>

    <template v-else>
      <div class="calendar-grid">
        <div v-for="day in weekDays" :key="day" class="weekday">{{ day }}</div>
        <button
          v-for="(cell, index) in cells"
          :key="index"
          class="day-cell"
          :class="{
            'is-empty': !cell,
            'is-today': cell && isToday(cell),
            'is-selected': cell && iso(cell) === selectedDate
          }"
          :disabled="!cell"
          @click="cell && selectDay(iso(cell))"
        >
          <template v-if="cell">
            <span class="day-number">{{ cell.getDate() }}</span>
            <span class="day-events-mini">
              <span
                v-for="(event, i) in eventsFor(iso(cell)).slice(0, 3)"
                :key="i"
                class="day-event"
                :class="`day-event--${event.type}`"
                :title="event.name"
              >{{ truncateName(event.name) }}</span>
              <span v-if="eventsFor(iso(cell)).length > 3" class="day-more">
                +{{ eventsFor(iso(cell)).length - 3 }}
              </span>
            </span>
          </template>
        </button>
      </div>

      <div class="day-events">
        <div class="day-events-head">
          <AppIcon name="calendar-days" :size="16" />
          <span>{{ selectedLabel }}</span>
          <span class="events-count">{{ selectedEvents.length }}</span>
        </div>
        <div v-if="selectedEvents.length === 0" class="events-empty">
          На этот день ничего не запланировано.
        </div>
        <ul v-else class="events-list">
          <li
            v-for="(event, index) in selectedEvents"
            :key="index"
            class="event-item"
            :class="`event-item--${event.type}`"
          >
            <span class="event-dot" :class="`dot-${event.type}`"></span>
            <span class="event-type">{{ typeLabel(event.type) }}</span>
            <span class="event-name">{{ event.name }}</span>
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>

<script>
import { getAllProjects, ACTIVE_PROJECT_STATUSES } from '../../api/projects.js';
import { getTasks } from '../../api/tasks.js';
import { getReminderOccurrences } from '../../api/reminders.js';

const WEEK_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];
const TYPE_LABELS = { project: 'Проект', task: 'Задача', reminder: 'Напоминание' };

export default {
  name: 'CalendarPanel',

  props: {
    projects: {
      type: Array,
      default: null
    },
    tasks: {
      type: Array,
      default: null
    }
  },

  emits: ['changed'],

  data() {
    const today = new Date();
    return {
      weekDays: WEEK_DAYS,
      filterOptions: [
        { type: 'project', label: 'Проекты' },
        { type: 'task', label: 'Задачи' },
        { type: 'reminder', label: 'Напоминания' }
      ],
      filters: { project: true, task: true, reminder: true },
      cursor: new Date(today.getFullYear(), today.getMonth(), 1),
      selectedDate: this.isoOf(today),
      ownProjects: [],
      ownTasks: [],
      occurrences: [],
      loading: false,
      error: null
    };
  },

  computed: {
    monthLabel() {
      return `${MONTH_NAMES[this.cursor.getMonth()]} ${this.cursor.getFullYear()}`;
    },

    cells() {
      const year = this.cursor.getFullYear();
      const month = this.cursor.getMonth();
      const first = new Date(year, month, 1);
      const offset = (first.getDay() + 6) % 7;
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const cells = [];
      for (let i = 0; i < offset; i++) cells.push(null);
      for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(year, month, day));
      while (cells.length % 7 !== 0) cells.push(null);
      return cells;
    },

    monthProjects() {
      return this.projects !== null ? this.projects : this.ownProjects;
    },

    monthTasks() {
      return this.tasks !== null ? this.tasks : this.ownTasks;
    },

    eventsByDate() {
      const map = {};
      const push = (date, event) => {
        if (!date) return;
        const key = String(date).split('T')[0];
        (map[key] = map[key] || []).push(event);
      };

      if (this.filters.project) {
        this.monthProjects.forEach(project => {
          if (project.dueDate) {
            push(project.dueDate, { type: 'project', name: project.name });
          }
        });
      }
      if (this.filters.task) {
        this.monthTasks.forEach(task => {
          if (task.dueDate && !task.isComplete) {
            push(task.dueDate, { type: 'task', name: task.name });
          }
        });
      }
      if (this.filters.reminder) {
        this.occurrences.forEach(occurrence => {
          push(occurrence.date, { type: 'reminder', name: occurrence.name });
        });
      }
      return map;
    },

    selectedEvents() {
      return this.eventsFor(this.selectedDate);
    },

    selectedLabel() {
      if (!this.selectedDate) return '';
      const [year, month, day] = this.selectedDate.split('-');
      return `${day}.${month}.${year}`;
    }
  },

  methods: {
    isoOf(date) {
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${date.getFullYear()}-${month}-${day}`;
    },

    iso(date) {
      return this.isoOf(date);
    },

    isToday(date) {
      return this.iso(date) === this.isoOf(new Date());
    },

    eventsFor(key) {
      return this.eventsByDate[key] || [];
    },

    truncateName(name) {
      if (!name) return '';
      return name.length > 30 ? `${name.slice(0, 30).trimEnd()}…` : name;
    },

    typeLabel(type) {
      return TYPE_LABELS[type] || type;
    },

    toggleFilter(type) {
      this.filters = { ...this.filters, [type]: !this.filters[type] };
    },

    monthRange() {
      const year = this.cursor.getFullYear();
      const month = this.cursor.getMonth();
      const first = new Date(year, month, 1);
      const last = new Date(year, month + 1, 0);
      return { from: this.iso(first), to: this.iso(last) };
    },

    prevMonth() {
      this.cursor = new Date(this.cursor.getFullYear(), this.cursor.getMonth() - 1, 1);
      this.loadMonth();
    },

    nextMonth() {
      this.cursor = new Date(this.cursor.getFullYear(), this.cursor.getMonth() + 1, 1);
      this.loadMonth();
    },

    goToday() {
      const today = new Date();
      this.cursor = new Date(today.getFullYear(), today.getMonth(), 1);
      this.selectedDate = this.isoOf(today);
      this.loadMonth();
    },

    selectDay(key) {
      this.selectedDate = key;
    },

    async loadMonth() {
      this.loading = true;
      this.error = null;
      const { from, to } = this.monthRange();
      try {
        const requests = [getReminderOccurrences(from, to)];
        if (this.projects === null) {
          requests.push(getAllProjects({ statuses: ACTIVE_PROJECT_STATUSES, sortByPriority: false }));
        }
        if (this.tasks === null) {
          requests.push(getTasks());
        }
        const [occurrencesRes, projectsRes, tasksRes] = await Promise.all(requests);

        if (occurrencesRes.isSuccess) {
          this.occurrences = occurrencesRes.data || [];
        } else {
          this.error = occurrencesRes.errorMessage || 'Не удалось загрузить напоминания';
        }
        if (projectsRes) {
          this.ownProjects = projectsRes.isSuccess ? (projectsRes.data?.projects || []) : [];
        }
        if (tasksRes) {
          this.ownTasks = tasksRes.isSuccess ? (tasksRes.data || []) : [];
        }
      } catch (err) {
        console.error('Ошибка загрузки календаря:', err);
        this.error = 'Не удалось загрузить данные календаря';
      } finally {
        this.loading = false;
      }
    }
  },

  mounted() {
    this.loadMonth();
  }
};
</script>

<style scoped>
.calendar-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.calendar-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.calendar-nav {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.calendar-month {
  min-width: 160px;
  text-align: center;
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-primary);
}

.nav-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  background-color: var(--bg-secondary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: color var(--transition-base), border-color var(--transition-base);
}

.nav-btn:hover {
  color: var(--neon-cyan);
  border-color: var(--accent-primary);
}

.today-btn {
  padding: 8px 14px;
  background-color: var(--bg-secondary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 13px;
  cursor: pointer;
  transition: color var(--transition-base), border-color var(--transition-base);
}

.today-btn:hover {
  color: var(--neon-cyan);
  border-color: var(--accent-primary);
}

.calendar-filters {
  display: inline-flex;
  gap: 6px;
  flex-wrap: wrap;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background-color: var(--bg-secondary);
  color: var(--text-muted);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 12.5px;
  cursor: pointer;
  transition: color var(--transition-base), border-color var(--transition-base), opacity var(--transition-base);
}

.filter-chip.active {
  color: var(--text-primary);
  border-color: var(--border-light);
}

.filter-chip:not(.active) {
  opacity: 0.5;
}

.filter-dot,
.event-dot,
.day-dot {
  display: inline-block;
  border-radius: 50%;
}

.filter-dot {
  width: 8px;
  height: 8px;
}

.calendar-state {
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

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.weekday {
  text-align: center;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
  padding-bottom: 4px;
}

.day-cell {
  position: relative;
  min-height: 96px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 3px;
  padding: 6px;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  cursor: pointer;
  overflow: hidden;
  transition: border-color var(--transition-base), box-shadow var(--transition-base);
}

.day-cell.is-empty {
  background: transparent;
  border-color: transparent;
  cursor: default;
}

.day-cell:not(.is-empty):hover {
  border-color: var(--accent-primary);
}

.day-cell.is-today {
  border-color: var(--accent-purple);
}

.day-cell.is-selected {
  border-color: var(--accent-primary);
  box-shadow: var(--glow-cyan);
}

.day-number {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-secondary);
}

.day-cell.is-today .day-number {
  color: var(--neon-violet);
  font-weight: 700;
}

.day-events-mini {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 2px;
  min-width: 0;
}

.day-event {
  display: block;
  padding: 2px 5px 2px 6px;
  border: 1px solid var(--border-color);
  border-left: 2px solid currentColor;
  border-radius: var(--radius-sm);
  font-size: 11px;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.day-event--project {
  color: var(--entity-project);
  background-color: color-mix(in srgb, var(--entity-project) 12%, var(--bg-secondary));
}

.day-event--task {
  color: var(--entity-task);
  background-color: color-mix(in srgb, var(--entity-task) 12%, var(--bg-secondary));
}

.day-event--reminder {
  color: var(--entity-reminder);
  background-color: color-mix(in srgb, var(--entity-reminder) 12%, var(--bg-secondary));
}

.day-more {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-muted);
}

/* Цвета сущностей */
.dot-project,
.event-item--project .event-dot {
  background-color: var(--entity-project);
}

.dot-task,
.event-item--task .event-dot {
  background-color: var(--entity-task);
}

.dot-reminder,
.event-item--reminder .event-dot {
  background-color: var(--entity-reminder);
}

.day-events {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 16px;
}

.day-events-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: var(--text-primary);
  font-weight: 600;
}

.events-count {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--neon-cyan);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 1px 8px;
}

.events-empty {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.events-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.event-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
}

.event-item--project {
  border-left: 3px solid var(--entity-project);
}

.event-item--task {
  border-left: 3px solid var(--entity-task);
}

.event-item--reminder {
  border-left: 3px solid var(--entity-reminder);
}

.event-dot {
  width: 8px;
  height: 8px;
  flex-shrink: 0;
}

.event-type {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.event-name {
  color: var(--text-primary);
  word-break: break-word;
}

@media (max-width: 600px) {
  .day-cell {
    min-height: 78px;
    padding: 4px;
  }

  .day-number {
    font-size: 11px;
  }

  .day-event {
    font-size: 10px;
  }
}
</style>
