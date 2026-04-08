<script setup>
import { ref, onMounted } from 'vue'
import packageJson from '../../package.json'
import { getHealth } from '../api/weeklyTasks'

/**
 * Главная страница приложения
 * Отображает название проекта и навигацию
 */
const version = packageJson.version
const backendVersion = ref('...')
const backendHealthy = ref(null)
const healthError = ref(false)

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
      <h1 class="project-title">Air-Task</h1>
      <p class="project-subtitle">Система отслеживания еженедельных задач</p>
      
      <div class="version-info">
        <p class="version">Версия фронта: {{ version }}</p>
        <p class="version">Версия бекенда: {{ backendVersion }}</p>
        <div class="health-status">
          <span class="health-label">Статус бекенда:</span>
          <span v-if="healthError" class="health-value error"> недоступен</span>
          <span v-else-if="backendHealthy" class="health-value healthy"> здоров</span>
          <span v-else class="health-value unhealthy"> проблемы</span>
        </div>
      </div>

      <div class="navigation">
        <router-link to="/weekly-tasks" class="nav-button">
          📊 Еженедельные задачи
        </router-link>
        <router-link to="/tasks" class="nav-button nav-button-tasks">
          📝 Задачи
        </router-link>
        <router-link to="/purchases" class="nav-button nav-button-purchases">
          🛒 Покупки
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.home-content {
  text-align: center;
  padding: 40px;
  background: var(--bg-secondary);
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  max-width: 400px;
  width: 90%;
  transition: background-color 0.3s ease;
}

.project-title {
  font-size: 3rem;
  margin: 0 0 10px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.project-subtitle {
  color: var(--text-secondary);
  font-size: 1.1rem;
  margin: 0 0 10px 0;
}

.version-info {
  margin: 0 0 20px 0;
}

.version {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin: 0 0 5px 0;
}

.health-status {
  margin-top: 0px;
}

.health-label {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.health-value {
  margin-left: 5px;
  font-weight: 600;
}

.health-value.healthy {
  color: #4ade80;
}

.health-value.unhealthy,
.health-value.error {
  color: #f87171;
}

.navigation {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.nav-button {
  display: inline-block;
  padding: 14px 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  transition: transform 0.2s, box-shadow 0.2s;
}

.nav-button-tasks {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.nav-button-purchases {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.nav-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.nav-button-tasks:hover {
  box-shadow: 0 6px 20px rgba(245, 87, 108, 0.4);
}

.nav-button-purchases:hover {
  box-shadow: 0 6px 20px rgba(79, 172, 254, 0.4);
}

.nav-button:active {
  transform: translateY(0);
}
</style>
