<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Sun, Moon, LogOut, Wallet } from 'lucide-vue-next'
import { useAuth, logout } from './store/auth'
import { useWallet, refreshWallet } from './store/wallet'

const router = useRouter()
const route = useRoute()
const auth = useAuth()
const wallet = useWallet()

function handleLogout() {
  logout()
  router.push('/login')
}

function openRewards() {
  router.push({ path: '/workspace', query: { tab: 'rewards' } })
}

/**
 * Главный компонент приложения.
 *
 * Использует vue-router для навигации между страницами.
 * Здесь живёт только фиксированный HUD-хром: баланс монет, переключатель темы и выход.
 */

// Тёмная киберпанк-тема — основная
const isDark = ref(true)

const toggleTheme = () => {
  isDark.value = !isDark.value
  applyTheme()
}

const applyTheme = () => {
  if (isDark.value) {
    document.documentElement.removeAttribute('data-theme')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.setAttribute('data-theme', 'light')
    localStorage.setItem('theme', 'light')
  }
}

onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  isDark.value = savedTheme !== 'light'
  applyTheme()
  if (auth.isAuthenticated) {
    refreshWallet()
  }
})

watch(
  () => route.fullPath,
  () => {
    if (auth.isAuthenticated) {
      refreshWallet()
    }
  }
)
</script>

<template>
  <div class="app-wrapper">
    <div class="hud-chrome">
      <button
        v-if="auth.isAuthenticated"
        class="hud-btn hud-btn-balance"
        type="button"
        :title="`Монеты: ${wallet.balance ?? '—'} — открыть награды`"
        :aria-label="`Монеты: ${wallet.balance ?? '—'} — открыть награды`"
        @click="openRewards"
      >
        <Wallet :size="16" aria-hidden="true" />
        <span class="hud-balance-value">{{ wallet.balance ?? '—' }}</span>
      </button>

      <button
        v-if="auth.isAuthenticated"
        class="hud-btn hud-btn-logout"
        @click="handleLogout"
        title="Выйти из системы"
      >
        <LogOut :size="16" aria-hidden="true" />
        <span>Выйти</span>
      </button>

      <button
        class="hud-btn hud-btn-icon"
        @click="toggleTheme"
        :title="isDark ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'"
        :aria-label="isDark ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'"
      >
        <Sun v-if="isDark" :size="18" aria-hidden="true" />
        <Moon v-else :size="18" aria-hidden="true" />
      </button>
    </div>

    <router-view />
  </div>
</template>

<style>
/* Глобальные стили оболочки приложения */
body {
  margin: 0;
  padding: 0;
}

#app {
  min-height: 100vh;
}

.app-wrapper {
  position: relative;
  min-height: 100vh;
}

/* Фиксированный HUD-хром в правом верхнем углу */
.hud-chrome {
  position: fixed;
  top: 14px;
  right: 16px;
  z-index: var(--z-chrome);
  display: flex;
  align-items: center;
  gap: 8px;
}

.hud-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 40px;
  padding: 0 14px;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-secondary);
  background: rgba(18, 25, 38, 0.85);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  backdrop-filter: blur(6px);
  transition: color var(--transition-base), border-color var(--transition-base),
    box-shadow var(--transition-base), background-color var(--transition-base),
    transform var(--transition-fast);
}

[data-theme="light"] .hud-btn {
  background: rgba(255, 255, 255, 0.85);
}

.hud-btn:hover {
  color: var(--neon-violet);
  border-color: var(--accent-purple);
  box-shadow: var(--glow-violet);
}

.hud-btn:active {
  transform: translateY(1px);
}

.hud-btn-icon {
  width: 40px;
  padding: 0;
  border-radius: 50%;
}

.hud-btn-logout:hover {
  color: var(--neon-red);
  border-color: var(--accent-red);
  box-shadow: var(--glow-red);
}

.hud-btn-balance {
  color: var(--entity-rewards);
  border-color: color-mix(in srgb, var(--entity-rewards) 45%, transparent);
}

.hud-btn-balance:hover {
  color: var(--entity-rewards);
  border-color: var(--entity-rewards);
  box-shadow: var(--glow-rewards);
}

.hud-balance-value {
  font-family: var(--font-mono);
  font-size: 13px;
  letter-spacing: 0.05em;
  min-width: 2ch;
  text-align: right;
}

@media (max-width: 600px) {
  .hud-chrome {
    top: 10px;
    right: 10px;
  }

  .hud-btn-logout span {
    display: none;
  }

  .hud-btn-logout {
    width: 40px;
    padding: 0;
    border-radius: 50%;
  }
}
</style>
