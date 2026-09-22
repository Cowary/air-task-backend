<template>
  <div class="container">
    <!-- Кнопка возврата на главную -->
    <router-link to="/" class="back-button">
      <ArrowLeft :size="16" aria-hidden="true" />
      <span>На главную</span>
    </router-link>

    <!-- Заголовок страницы -->
    <header class="page-head">
      <div class="page-head-icon">
        <Rocket :size="22" aria-hidden="true" />
      </div>
      <div>
        <h1>Рабочее место</h1>
        <p class="subtitle">Проекты, цели, еженедельные задачи и задачи — всё в одном месте</p>
      </div>
    </header>

    <!-- Первичная загрузка -->
    <div v-if="initialLoading" class="loading">
      <div class="spinner"></div>
      <p>Загрузка данных...</p>
    </div>

    <!-- Ошибка первичной загрузки -->
    <div v-else-if="error" class="error-message" role="alert">
      <p class="error-text">
        <TriangleAlert :size="18" aria-hidden="true" />
        <span>{{ error }}</span>
      </p>
      <button @click="loadAll()" class="retry-btn">Повторить</button>
    </div>

    <div v-else class="content">
      <!-- Вкладки -->
      <div class="workspace-tabs" role="tablist">
        <button
          class="tab-btn tab-project"
          :class="{ active: activeTab === 'projects' }"
          role="tab"
          :aria-selected="activeTab === 'projects'"
          @click="activeTab = 'projects'"
        >
          <FolderKanban :size="16" aria-hidden="true" />
          <span>Проекты</span>
        </button>
        <button
          class="tab-btn tab-week"
          :class="{ active: activeTab === 'week' }"
          role="tab"
          :aria-selected="activeTab === 'week'"
          @click="activeTab = 'week'"
        >
          <CalendarDays :size="16" aria-hidden="true" />
          <span>Неделя</span>
        </button>
        <button
          class="tab-btn tab-task"
          :class="{ active: activeTab === 'tasks' }"
          role="tab"
          :aria-selected="activeTab === 'tasks'"
          @click="activeTab = 'tasks'"
        >
          <ListChecks :size="16" aria-hidden="true" />
          <span>Все задачи</span>
        </button>
        <button
          class="tab-btn tab-idea"
          :class="{ active: activeTab === 'ideas' }"
          role="tab"
          :aria-selected="activeTab === 'ideas'"
          @click="activeTab = 'ideas'"
        >
          <Lightbulb :size="16" aria-hidden="true" />
          <span>Идеи</span>
        </button>
        <button
          class="tab-btn tab-reminder"
          :class="{ active: activeTab === 'reminders' }"
          role="tab"
          :aria-selected="activeTab === 'reminders'"
          @click="activeTab = 'reminders'"
        >
          <Repeat :size="16" aria-hidden="true" />
          <span>Напоминания</span>
        </button>
        <button
          class="tab-btn tab-rewards"
          :class="{ active: activeTab === 'rewards' }"
          role="tab"
          :aria-selected="activeTab === 'rewards'"
          @click="activeTab = 'rewards'"
        >
          <Wallet :size="16" aria-hidden="true" />
          <span>Награды</span>
        </button>
        <button
          class="tab-btn tab-calendar"
          :class="{ active: activeTab === 'calendar' }"
          role="tab"
          :aria-selected="activeTab === 'calendar'"
          @click="activeTab = 'calendar'"
        >
          <CalendarRange :size="16" aria-hidden="true" />
          <span>Календарь</span>
        </button>
        <button
          class="tab-btn tab-archive"
          :class="{ active: activeTab === 'archive' }"
          role="tab"
          :aria-selected="activeTab === 'archive'"
          @click="activeTab = 'archive'"
        >
          <Archive :size="16" aria-hidden="true" />
          <span>Архив</span>
        </button>
      </div>

      <!-- Индикатор фонового обновления -->
      <div v-if="refreshing" class="refreshing">
        <span class="refreshing-dot" aria-hidden="true"></span>
        Обновление данных...
      </div>

      <!-- Проекты -->
      <ProjectsPanel
        v-if="activeTab === 'projects'"
        :projects="projects"
        :tasks="tasks"
        :week-map="weekMap"
        @changed="refresh"
        @statuses-changed="handleProjectsStatusesChanged"
      />

      <!-- Неделя -->
      <WeekPanel
        v-else-if="activeTab === 'week'"
        :statistics="statistics"
        @changed="refresh"
      />

      <!-- Все задачи -->
      <template v-else-if="activeTab === 'tasks'">
        <div class="completion-toggle">
          <button
            class="completion-btn"
            :class="{ active: tasksFilter === 'incomplete' }"
            @click="tasksFilter = 'incomplete'"
          >
            Невыполненные
          </button>
          <button
            class="completion-btn"
            :class="{ active: tasksFilter === 'completed' }"
            @click="tasksFilter = 'completed'"
          >
            Выполненные
          </button>
          <button
            class="completion-btn"
            :class="{ active: tasksFilter === 'all' }"
            @click="tasksFilter = 'all'"
          >
            Все
          </button>
        </div>
        <TaskListSection
          :tasks="filteredAllTasks"
          :projects="projects"
          :show-filters="true"
          :show-sort="true"
          :default-filter-project="NO_PROJECT_FILTER"
          empty-text="Задач пока нет. Создайте первую!"
          @changed="refresh"
        />
      </template>

      <!-- Идеи -->
      <IdeasPanel
        v-else-if="activeTab === 'ideas'"
        :ideas="ideas"
        :projects="projects"
        @changed="refresh"
      />

      <!-- Напоминания -->
      <RemindersPanel
        v-else-if="activeTab === 'reminders'"
        @changed="refresh"
      />

      <!-- Награды -->
      <RewardsPanel
        v-else-if="activeTab === 'rewards'"
        @changed="refresh"
      />

      <!-- Календарь -->
      <CalendarPanel
        v-else-if="activeTab === 'calendar'"
        :projects="projects"
        :tasks="tasks"
        @changed="refresh"
      />

      <!-- Архив выполненных задач -->
      <TaskListSection
        v-else
        :tasks="archivedTasks"
        :projects="projects"
        :show-filters="true"
        empty-text="Выполненных задач пока нет."
        @changed="refresh"
      />
    </div>
  </div>
</template>

<script>
import {
  ArrowLeft,
  Rocket,
  FolderKanban,
  CalendarDays,
  ListChecks,
  Archive,
  Lightbulb,
  Repeat,
  CalendarRange,
  TriangleAlert,
  Wallet
} from 'lucide-vue-next';
import { getAllProjects, ACTIVE_PROJECT_STATUSES } from '../api/projects.js';
import { getTasks } from '../api/tasks.js';
import { getWeeklyTaskStatistics } from '../api/weeklyTasks.js';
import { getAllIdeas } from '../api/ideas.js';
import { refreshWallet } from '../store/wallet.js';
import ProjectsPanel from '../components/workspace/ProjectsPanel.vue';
import WeekPanel from '../components/workspace/WeekPanel.vue';
import IdeasPanel from '../components/workspace/IdeasPanel.vue';
import RemindersPanel from '../components/workspace/RemindersPanel.vue';
import RewardsPanel from '../components/workspace/RewardsPanel.vue';
import CalendarPanel from '../components/workspace/CalendarPanel.vue';
import TaskListSection, { NO_PROJECT_FILTER } from '../components/workspace/TaskListSection.vue';

export default {
  name: 'WorkspacePage',

  components: {
    ArrowLeft,
    Rocket,
    FolderKanban,
    CalendarDays,
    ListChecks,
    Archive,
    Lightbulb,
    Repeat,
    CalendarRange,
    TriangleAlert,
    Wallet,
    ProjectsPanel,
    WeekPanel,
    IdeasPanel,
    RemindersPanel,
    RewardsPanel,
    CalendarPanel,
    TaskListSection
  },

  data() {
    return {
      NO_PROJECT_FILTER,

      activeTab: 'projects',
      tasksFilter: 'incomplete',

      projects: [],
      tasks: [],
      ideas: [],
      statistics: null,

      // Статусы проектов для запроса к бэкенду (фильтр в сайдбаре «Проекты»)
      projectStatuses: ACTIVE_PROJECT_STATUSES,

      initialLoading: false,
      refreshing: false,
      error: null
    };
  },

  computed: {
    // Задачи вкладки «Все задачи» с учётом переключателя выполненности
    filteredAllTasks() {
      if (this.tasksFilter === 'incomplete') {
        return this.tasks.filter(task => !task.isComplete);
      }
      if (this.tasksFilter === 'completed') {
        return this.tasks.filter(task => !!task.isComplete);
      }
      return this.tasks;
    },

    // Вкладка «Архив» — только выполненные задачи
    archivedTasks() {
      return this.tasks.filter(task => !!task.isComplete);
    },

    // Map weeklyTaskId -> статистика выполнения на текущей неделе
    weekMap() {
      const map = {};
      const all = [
        ...(this.statistics?.completedTasks || []),
        ...(this.statistics?.incompleteTasks || [])
      ];
      all.forEach(item => {
        if (item.weeklyTaskId != null) {
          map[item.weeklyTaskId] = item;
        }
      });
      return map;
    }
  },

  methods: {
    async loadAll(silent = false) {
      if (silent) {
        this.refreshing = true;
      } else {
        this.initialLoading = true;
        this.error = null;
      }

      try {
        const [projectsRes, tasksRes, statsRes, ideasRes] = await Promise.all([
          getAllProjects({ statuses: this.projectStatuses, sortByPriority: true }),
          getTasks(),
          getWeeklyTaskStatistics(),
          getAllIdeas(),
          refreshWallet()
        ]);

        let hasError = false;

        if (projectsRes.isSuccess) {
          this.projects = projectsRes.data?.projects || [];
        } else {
          hasError = true;
          console.error('Ошибка загрузки проектов:', projectsRes.errorMessage);
        }

        if (tasksRes.isSuccess) {
          this.tasks = tasksRes.data || [];
        } else {
          hasError = true;
          console.error('Ошибка загрузки задач:', tasksRes.errorMessage);
        }

        if (statsRes.isSuccess) {
          this.statistics = statsRes.data;
        } else {
          hasError = true;
          console.error('Ошибка загрузки статистики:', statsRes.errorMessage);
        }

        if (ideasRes.isSuccess) {
          this.ideas = ideasRes.data || [];
        } else {
          hasError = true;
          console.error('Ошибка загрузки идей:', ideasRes.errorMessage);
        }

        if (hasError) {
          if (this.initialLoading) {
            this.error = 'Не удалось загрузить часть данных. Проверьте, запущен ли сервер.';
          } else {
            alert('Не удалось обновить данные: ' + (
              projectsRes.errorMessage || tasksRes.errorMessage || statsRes.errorMessage
              || ideasRes.errorMessage || 'Неизвестная ошибка'
            ));
          }
        }
      } catch (err) {
        console.error('Ошибка загрузки данных рабочего места:', err);
        if (this.initialLoading) {
          this.error = 'Не удалось загрузить данные. Проверьте, запущен ли сервер.';
        } else {
          alert('Ошибка при обновлении данных');
        }
      } finally {
        this.initialLoading = false;
        this.refreshing = false;
      }
    },

    refresh() {
      this.loadAll(true);
    },

    async handleProjectsStatusesChanged(statuses) {
      this.projectStatuses = statuses;
      this.refreshing = true;

      try {
        const response = await getAllProjects({ statuses, sortByPriority: true });

        if (response.isSuccess) {
          this.projects = response.data?.projects || [];
        } else {
          alert('Не удалось обновить список проектов: ' + (response.errorMessage || 'Неизвестная ошибка'));
        }
      } catch (err) {
        console.error('Ошибка загрузки проектов:', err);
        alert('Ошибка при загрузке проектов');
      } finally {
        this.refreshing = false;
      }
    }
  },

  mounted() {
    const requestedTab = this.$route?.query?.tab;
    const knownTabs = ['projects', 'week', 'tasks', 'ideas', 'reminders', 'rewards', 'calendar', 'archive'];
    if (typeof requestedTab === 'string' && knownTabs.includes(requestedTab)) {
      this.activeTab = requestedTab;
    }
    this.loadAll();
  }
};
</script>

<style scoped>
.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 20px;
  padding-top: 64px;
}

.page-head {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin-bottom: 22px;
  text-align: left;
}

.page-head-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  flex-shrink: 0;
  color: var(--neon-violet);
  background: var(--bg-secondary);
  border: 1px solid color-mix(in srgb, var(--neon-violet) 45%, var(--border-light));
  border-radius: var(--radius-sm);
  box-shadow: var(--glow-violet);
}

h1 {
  font-size: 1.9rem;
  margin: 0;
  color: var(--text-primary);
}

.subtitle {
  margin: 4px 0 0 0;
  color: var(--text-secondary);
  font-size: 0.92rem;
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background-color: var(--bg-secondary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  text-decoration: none;
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  transition: color var(--transition-base), border-color var(--transition-base),
    box-shadow var(--transition-base);
}

.back-button:hover {
  text-decoration: none;
  color: var(--neon-cyan);
  border-color: var(--accent-primary);
  box-shadow: var(--glow-cyan);
}

.loading {
  text-align: center;
  padding: 50px;
}

.spinner {
  border: 4px solid var(--spinner-bg);
  border-top: 4px solid var(--accent-primary);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
  box-shadow: 0 0 18px rgba(34, 211, 238, 0.25);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  text-align: center;
  padding: 26px;
  background-color: var(--accent-red-light);
  border: 1px solid var(--accent-red);
  border-radius: var(--radius-md);
  color: var(--neon-red);
}

.error-text {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: var(--neon-red);
}

.retry-btn {
  margin-top: 15px;
  padding: 10px 20px;
  background-color: var(--accent-primary);
  color: var(--on-neon);
  border: none;
  border-radius: var(--radius-sm);
  font-weight: 600;
  cursor: pointer;
  transition: filter var(--transition-base), box-shadow var(--transition-base);
}

.retry-btn:hover {
  filter: brightness(1.1);
  box-shadow: var(--glow-cyan);
}

/* Вкладки */
.workspace-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 20px;
  background-color: var(--bg-secondary);
  border-radius: var(--radius-md);
  padding: 4px;
  border: 1px solid var(--border-color);
  width: 100%;
  max-width: min(100%, 1120px);
  overflow-x: auto;
  margin-left: auto;
  margin-right: auto;
}

.tab-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 18px;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: color var(--transition-base), background-color var(--transition-base),
    border-color var(--transition-base), box-shadow var(--transition-base);
  white-space: nowrap;
}

.tab-btn:hover {
  color: var(--text-primary);
  background-color: var(--bg-tertiary);
}

.tab-btn.active {
  background-color: var(--accent-purple-light);
  border-color: var(--accent-purple);
  color: var(--neon-violet);
  box-shadow: var(--glow-violet);
}

/* Иконка вкладки = цвет сущности (DESIGN.md §7) */
.tab-project :deep(svg) { color: var(--entity-project); }
.tab-week :deep(svg) { color: var(--entity-weekly); }
.tab-task :deep(svg) { color: var(--entity-task); }
.tab-idea :deep(svg) { color: var(--entity-idea); }
.tab-reminder :deep(svg) { color: var(--entity-reminder); }
.tab-rewards :deep(svg) { color: var(--entity-rewards); }
.tab-calendar :deep(svg) { color: var(--neon-cyan); }
.tab-archive :deep(svg) { color: var(--accent-gray); }

.tab-btn.active :deep(svg) {
  filter: drop-shadow(0 0 6px currentColor);
}

.completion-toggle {
  display: inline-flex;
  gap: 4px;
  padding: 3px;
  margin-bottom: 15px;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
}

.completion-btn {
  padding: 6px 14px;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: color var(--transition-base), background-color var(--transition-base),
    border-color var(--transition-base);
}

.completion-btn:hover {
  color: var(--text-primary);
}

.completion-btn.active {
  background-color: var(--accent-purple-light);
  border-color: var(--accent-purple);
  color: var(--neon-violet);
}

.refreshing {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 10px;
}

.refreshing-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--neon-cyan);
  box-shadow: 0 0 10px var(--neon-cyan);
  animation: pulse-glow 1.2s ease-in-out infinite;
}

@media (max-width: 600px) {
  .page-head {
    flex-direction: column;
    text-align: center;
  }

  h1 {
    font-size: 1.5rem;
  }

  .workspace-tabs {
    max-width: none;
    overflow-x: auto;
    justify-content: flex-start;
  }

  .tab-btn {
    flex: 0 0 auto;
    padding: 10px 10px;
    font-size: 12.5px;
    gap: 6px;
  }
}
</style>
