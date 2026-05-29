<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
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
      <h1 class="login-title">Air-Task</h1>
      <p class="login-subtitle">Вход в систему</p>

      <form @submit.prevent="handleSubmit" class="login-form">
        <div class="form-group">
          <label for="login">Логин</label>
          <input
            id="login"
            v-model="loginField"
            type="text"
            placeholder="Введите логин"
            required
            autocomplete="username"
          />
        </div>

        <div class="form-group">
          <label for="password">Пароль</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="Введите пароль"
            required
            autocomplete="current-password"
          />
        </div>

        <p v-if="auth.loginError" class="error-message">{{ auth.loginError }}</p>

        <button type="submit" class="login-button" :disabled="auth.isLoading">
          {{ auth.isLoading ? 'Вход...' : 'Войти' }}
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  text-align: center;
  padding: 40px;
  background: var(--bg-secondary);
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  max-width: 380px;
  width: 90%;
  transition: background-color 0.3s ease;
}

.login-title {
  font-size: 2.5rem;
  margin: 0 0 5px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.login-subtitle {
  color: var(--text-secondary);
  font-size: 1rem;
  margin: 0 0 24px 0;
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
  color: var(--text-primary);
  font-size: 0.9rem;
  font-weight: 500;
}

.form-group input {
  padding: 10px 14px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 1rem;
  background: var(--bg-primary);
  color: var(--text-primary);
  outline: none;
  transition: border-color 0.2s;
}

.form-group input:focus {
  border-color: var(--accent-primary);
}

.error-message {
  color: var(--accent-red);
  font-size: 0.9rem;
  margin: 0;
  text-align: center;
}

.login-button {
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.login-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.login-button:active:not(:disabled) {
  transform: translateY(0);
}

.login-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>
