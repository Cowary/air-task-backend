import { reactive } from 'vue'
import { login as authLogin } from '../api/auth'

const TOKEN_KEY = 'token'
const AUTH_DISABLED_KEY = 'auth_disabled'

const state = reactive({
  token: null,
  isAuthenticated: false,
  isAuthDisabled: false,
  loginError: null,
  isLoading: false
})

export function initAuth() {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    state.token = token
    state.isAuthenticated = true
    return
  }
  if (localStorage.getItem(AUTH_DISABLED_KEY)) {
    state.isAuthDisabled = true
    state.isAuthenticated = true
  }
}

export async function login(login, password) {
  state.isLoading = true
  state.loginError = null
  try {
    const result = await authLogin(login, password)
    if (result.token) {
      state.token = result.token
      state.isAuthenticated = true
      localStorage.setItem(TOKEN_KEY, result.token)
    }
    return true
  } catch (error) {
    const status = error.response?.status
    if (status === 503) {
      state.isAuthDisabled = true
      state.isAuthenticated = true
      localStorage.setItem(AUTH_DISABLED_KEY, 'true')
      return true
    }
    if (status === 401) {
      state.loginError = 'Неверный логин или пароль'
    } else {
      state.loginError = 'Ошибка подключения к серверу'
    }
    return false
  } finally {
    state.isLoading = false
  }
}

export function logout() {
  state.token = null
  state.isAuthenticated = false
  state.isAuthDisabled = false
  state.loginError = null
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(AUTH_DISABLED_KEY)
}

export function useAuth() {
  return state
}
