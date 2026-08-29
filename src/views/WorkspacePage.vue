<template>
  <div class="container">
    <!-- Кнопка возврата на главную -->
    <router-link to="/" class="back-button">← На главную</router-link>

    <!-- Заголовок страницы -->
    <h1>🚀 Рабочее место</h1>
    <p class="subtitle">Проекты, цели, еженедельные задачи и задачи — всё в одном месте</p>

    <!-- Первичная загрузка -->
    <div v-if="initialLoading" class="loading">
      <div class="spinner"></div>
      <p>Загрузка данных...</p>
    </div>

    <!-- Ошибка первичной загрузки -->
    <div v-else-if="error" class="error-message">
      <p>❌ {{ error }}</p>
      <button @click="loadAll()" class="retry-btn">Повторить</button>
    </div>

    <div v-else class="content">
      <!-- Вкладки -->
      <div class="workspace-tabs">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'projects' }"
          @click="activeTab = 'projects'"
        >
          📁 Проекты
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'week' }"
          @click="activeTab = 'week'"
        >
          📅 Неделя
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'tasks' }"
          @click="activeTab = 'tasks'"
        >
          📝 Все задачи
        </button>
      </div>

      <!-- Индикатор фонового обновления -->
      <div v-if="refreshing" class="refreshing">Обновление данных...</div>

      <!-- Проекты -->
      <ProjectsPanel
        v-if="activeTab === 'projects'"
        :projects="projects"
        :tasks="tasks"
        :week-map="weekMap"
        @changed="refresh"
      />

      <!-- Неделя -->
      <WeekPanel
        v-else-if="activeTab === 'week'"
        :statistics="statistics"
        @changed="refresh"
      />

      <!-- Все задачи -->
      <TaskListSection
        v-else
        :tasks="tasks"
        :projects="projects"
        :show-filters="true"
        empty-text="Задач пока нет. Создайте первую!"
        @changed="refresh"
      />
    </div>
  </div>
</template>

<script>
import { getAllProjects } from '../api/projects.js';
import { getTasks } from '../api/tasks.js';
import { getWeeklyTaskStatistics } from '../api/weeklyTasks.js';
import ProjectsPanel from '../components/workspace/ProjectsPanel.vue';
import WeekPanel from '../components/workspace/WeekPanel.vue';
import TaskListSection from '../components/workspace/TaskListSection.vue';

export default {
  name: 'WorkspacePage',

  components: {
    ProjectsPanel,
    WeekPanel,
    TaskListSection
  },

  data() {
    return {
      activeTab: 'projects',

      projects: [],
      tasks: [],
      statistics: null,

      initialLoading: false,
      refreshing: false,
      error: null
    };
  },

  computed: {
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
        const [projectsRes, tasksRes, statsRes] = await Promise.all([
          getAllProjects(),
          getTasks(),
          getWeeklyTaskStatistics()
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

        if (hasError) {
          if (this.initialLoading) {
            this.error = 'Не удалось загрузить часть данных. Проверьте, запущен ли сервер.';
          } else {
            alert('Не удалось обновить данные: ' + (
              projectsRes.errorMessage || tasksRes.errorMessage || statsRes.errorMessage || 'Неизвестная ошибка'
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
    }
  },

  mounted() {
    this.loadAll();
  }
};
</script>

<style scoped>
.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

h1 {
  text-align: center;
  color: var(--text-primary);
  margin-bottom: 5px;
}

.subtitle {
  text-align: center;
  color: var(--text-secondary);
  margin-bottom: 25px;
}

.back-button {
  display: inline-block;
  padding: 8px 16px;
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  text-decoration: none;
  border-radius: 5px;
  font-size: 14px;
  margin-bottom: 15px;
  transition: background-color 0.2s;
}

.back-button:hover {
  background-color: var(--border-color);
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
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  text-align: center;
  padding: 30px;
  background-color: var(--accent-red-light);
  border-radius: 8px;
  color: var(--accent-red);
}

.retry-btn {
  margin-top: 15px;
  padding: 10px 20px;
  background-color: var(--accent-primary);
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.retry-btn:hover {
  background-color: #5a6fd6;
}

/* Вкладки */
.workspace-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 20px;
  background-color: var(--bg-secondary);
  border-radius: 10px;
  padding: 4px;
  border: 1px solid var(--border-color);
  max-width: 560px;
  margin-left: auto;
  margin-right: auto;
}

.tab-btn {
  flex: 1;
  padding: 10px 18px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.tab-btn:hover {
  color: var(--text-primary);
  background-color: var(--bg-tertiary);
}

.tab-btn.active {
  background-color: var(--accent-primary);
  color: white;
}

.tab-btn.active:hover {
  background-color: #5a6fd6;
}

.refreshing {
  text-align: center;
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 10px;
}

@media (max-width: 600px) {
  .workspace-tabs {
    max-width: none;
  }

  .tab-btn {
    padding: 10px 8px;
    font-size: 13px;
  }
}
</style>
