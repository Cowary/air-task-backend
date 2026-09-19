<script setup>
import { ref, onMounted } from 'vue'
import {
  Rocket,
  ChartColumn,
  FolderKanban,
  ListChecks,
  ShoppingCart,
  ShieldCheck,
  ArrowRight
} from 'lucide-vue-next'
import packageJson from '../../package.json'
import { getHealth } from '../api/weeklyTasks'

/**
 * Главная страница приложения
 * Отображает название проекта, статус бекенда и навигацию по модулям
 */
const version = packageJson.version
const backendVersion = ref('...')
const backendHealthy = ref(null)
const healthError = ref(false)

const modules = [
  { to: '/workspace', label: 'Рабочее место', hint: 'Проекты и задачи', icon: Rocket, tone: 'magenta' },
  { to: '/weekly-tasks', label: 'Еженедельные задачи', hint: 'Ритм недели', icon: ChartColumn, tone: 'cyan' },
  { to: '/projects', label: 'Проекты', hint: 'Цели и прогресс', icon: FolderKanban, tone: 'green' },
  { to: '/tasks', label: 'Задачи', hint: 'Список дел', icon: ListChecks, tone: 'violet' },
  { to: '/purchases', label: 'Покупки', hint: 'Списки и цены', icon: ShoppingCart, tone: 'amber' }
]

onMounted(async () => {
  try {
    const health = await getHealth()
    backendVersion.value = health.version || 'unknown'
    backendHealthy.value = health.isHealthy
    healthError.value = false
  } catch (error) {
    console.error('Failed to load health:', error)
    healthError.value = true
    backendHealthy.value = false
  }
})
</script>

<template>
  <div class="home-container">
    <div class="home-content">
      <div class="home-brand">
        <span class="home-brand-dot" aria-hidden="true"></span>
        <span class="hud-label">Air Task // control center</span>
      </div>

      <h1 class="project-title">{{ 'AIR' }}<span class="title-accent">TASK</span></h1>
      <p class="project-subtitle">Система отслеживания задач, проектов и напоминаний</p>

      <div class="version-info">
        <div class="version-row">
          <span class="version-key">front</span>
          <span class="version-value">{{ version }}</span>
          <span class="version-key">back</span>
          <span class="version-value">{{ backendVersion }}</span>
        </div>
        <div class="health-status">
          <ShieldCheck :size="15" aria-hidden="true" />
          <span class="health-label">Статус бекенда:</span>
          <span v-if="healthError" class="health-value error">недоступен</span>
          <span v-else-if="backendHealthy" class="health-value healthy">здоров</span>
          <span v-else class="health-value unhealthy">проблемы</span>
        </div>
      </div>

      <nav class="navigation" aria-label="Модули приложения">
        <router-link
          v-for="module in modules"
          :key="module.to"
          :to="module.to"
          class="nav-button"
          :data-tone="module.tone"
        >
          <component :is="module.icon" class="nav-icon" :size="22" aria-hidden="true" />
          <span class="nav-text">
            <span class="nav-label">{{ module.label }}</span>
            <span class="nav-hint">{{ module.hint }}</span>
          </span>
          <ArrowRight class="nav-arrow" :size="18" aria-hidden="true" />
        </router-link>
      </nav>
    </div>
  </div>
</template>

<style scoped>
.home-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 40px 20px;
}

.home-content {
  width: 100%;
  max-width: 720px;
  padding: 36px 32px 32px;
  text-align: center;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-elevated);
  animation: screen-rise var(--transition-slow) both;
}

.home-brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}

.home-brand-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--neon-green);
  box-shadow: 0 0 10px var(--neon-green);
  animation: pulse-glow 2.4s ease-in-out infinite;
}

.project-title {
  margin: 0 0 8px 0;
  font-size: 3rem;
  font-weight: 900;
  letter-spacing: 0.14em;
  line-height: 1;
  color: var(--text-primary);
  text-shadow: var(--glow-text-cyan);
}

.title-accent {
  color: var(--neon-violet);
  text-shadow: var(--glow-text-violet);
}

.project-subtitle {
  color: var(--text-secondary);
  font-size: 1.02rem;
  margin: 0 0 22px 0;
}

.version-info {
  display: inline-flex;
  flex-direction: column;
  gap: 8px;
  margin: 0 0 26px 0;
  padding: 12px 18px;
  background: var(--bg-void);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
}

.version-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-mono);
  font-size: 12px;
}

.version-key {
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.14em;
}

.version-value {
  color: var(--text-secondary);
}

.health-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-muted);
}

.health-value {
  font-weight: 700;
}

.health-value.healthy {
  color: var(--neon-green);
}

.health-value.unhealthy,
.health-value.error {
  color: var(--neon-red);
}

.navigation {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  text-align: left;
}

.nav-button {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-left: 3px solid var(--tone, var(--accent-primary));
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  text-decoration: none;
  transition: transform var(--transition-base), border-color var(--transition-base),
    box-shadow var(--transition-base), background-color var(--transition-base);
}

.nav-button[data-tone='cyan'] {
  --tone: var(--neon-cyan);
  --tone-glow: var(--glow-cyan);
}

.nav-button[data-tone='magenta'] {
  --tone: var(--neon-magenta);
  --tone-glow: var(--glow-magenta);
}

.nav-button[data-tone='green'] {
  --tone: var(--neon-green);
  --tone-glow: var(--glow-green);
}

.nav-button[data-tone='violet'] {
  --tone: var(--neon-violet);
  --tone-glow: var(--glow-violet);
}

.nav-button[data-tone='amber'] {
  --tone: var(--neon-amber);
  --tone-glow: var(--glow-amber);
}

.nav-icon {
  color: var(--tone);
  flex-shrink: 0;
}

.nav-text {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.nav-label {
  font-weight: 600;
  font-size: 0.98rem;
  line-height: 1.25;
}

.nav-hint {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.nav-arrow {
  color: var(--text-muted);
  flex-shrink: 0;
  transition: transform var(--transition-base), color var(--transition-base);
}

.nav-button:hover {
  text-decoration: none;
  transform: translateY(-2px);
  border-color: var(--tone);
  background: var(--bg-elevated);
  box-shadow: var(--tone-glow);
}

.nav-button:hover .nav-arrow {
  color: var(--tone);
  transform: translateX(3px);
}

.nav-button:active {
  transform: translateY(0);
}

@media (max-width: 640px) {
  .home-content {
    padding: 26px 18px;
  }

  .project-title {
    font-size: 2.2rem;
  }

  .navigation {
    grid-template-columns: 1fr;
  }
}
</style>
