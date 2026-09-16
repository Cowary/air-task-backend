<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { SquareTerminal, LogIn, User, Lock, TriangleAlert } from 'lucide-vue-next'
import { useAuth, login } from '../store/auth'

const router = useRouter()
const auth = useAuth()

const loginField = ref('')
const password = ref('')

async function handleSubmit() {
  const success = await login(loginField.value, password.value)
  if (success) {
    router.push('/')
  }
}
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-brand">
        <SquareTerminal :size="26" aria-hidden="true" />
        <span class="login-brand-text">Air&nbsp;Task</span>
      </div>

      <h1 class="login-title">Вход в систему</h1>
      <p class="login-subtitle hud-label">Authorize // доступ к терминалу</p>

      <form @submit.prevent="handleSubmit" class="login-form">
        <div class="form-group">
          <label for="login">Логин</label>
          <div class="input-wrap">
            <User class="input-icon" :size="16" aria-hidden="true" />
            <input
              id="login"
              v-model="loginField"
              type="text"
              placeholder="Введите логин"
              required
              autocomplete="username"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="password">Пароль</label>
          <div class="input-wrap">
            <Lock class="input-icon" :size="16" aria-hidden="true" />
            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="Введите пароль"
              required
              autocomplete="current-password"
            />
          </div>
        </div>

        <p v-if="auth.loginError" class="error-message" role="alert">
          <TriangleAlert :size="15" aria-hidden="true" />
          <span>{{ auth.loginError }}</span>
        </p>

        <button type="submit" class="login-button" :disabled="auth.isLoading">
          <LogIn :size="18" aria-hidden="true" />
          <span>{{ auth.isLoading ? 'Вход...' : 'Войти' }}</span>
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 24px;
}

.login-card {
  position: relative;
  width: 100%;
  max-width: 400px;
  padding: 40px 32px 34px;
  background: var(--bg-secondary);
  border: 1px solid color-mix(in srgb, var(--neon-violet) 40%, var(--border-light));
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-elevated), var(--glow-violet);
  animation: screen-rise var(--transition-slow) both;
}

/* HUD-скобки по углам */
.login-card::before,
.login-card::after {
  content: '';
  position: absolute;
  width: 22px;
  height: 22px;
  border: 2px solid var(--neon-violet);
  pointer-events: none;
}

.login-card::before {
  top: -1px;
  left: -1px;
  border-right: none;
  border-bottom: none;
  border-top-left-radius: var(--radius-lg);
}

.login-card::after {
  right: -1px;
  bottom: -1px;
  border-left: none;
  border-top: none;
  border-bottom-right-radius: var(--radius-lg);
}

.login-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--neon-violet);
  margin-bottom: 18px;
}

.login-brand-text {
  font-family: var(--font-display);
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--text-primary);
}

.login-title {
  font-size: 1.9rem;
  margin: 0 0 6px 0;
  text-align: center;
  color: var(--text-primary);
}

.login-subtitle {
  margin: 0 0 28px 0;
  text-align: center;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  text-align: left;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 12px;
  color: var(--text-muted);
  pointer-events: none;
}

.form-group input {
  width: 100%;
  padding: 11px 14px 11px 38px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 0.95rem;
  background: var(--bg-void);
  color: var(--text-primary);
  outline: none;
  transition: border-color var(--transition-base), box-shadow var(--transition-base);
}

.form-group input::placeholder {
  color: var(--text-muted);
}

.form-group input:focus {
  border-color: var(--accent-primary);
  box-shadow: var(--glow-cyan);
}

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 8px 10px;
  color: var(--neon-red);
  background: var(--accent-red-light);
  border: 1px solid var(--accent-red);
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
}

.login-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 4px;
  padding: 13px 24px;
  background: var(--neon-magenta);
  color: var(--on-neon);
  border: none;
  border-radius: var(--radius-sm);
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  cursor: pointer;
  box-shadow: var(--glow-magenta);
  transition: transform var(--transition-base), box-shadow var(--transition-base),
    filter var(--transition-base);
}

.login-button:hover:not(:disabled) {
  transform: translateY(-1px);
  filter: brightness(1.08);
  box-shadow: 0 0 0 1px rgba(255, 47, 179, 0.5), 0 0 26px rgba(255, 47, 179, 0.42);
}

.login-button:active:not(:disabled) {
  transform: translateY(0);
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
}
</style>
