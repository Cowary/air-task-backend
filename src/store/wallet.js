import { reactive } from 'vue'
import { getWallet } from '../api/gamification'

const state = reactive({
  balance: null,
  totalEarned: null,
  totalSpent: null,
  isLoading: false
})

/**
 * Обновляет кошелёк монет из бэкенда.
 * Молча игнорирует ошибки: чип баланса не должен ломать страницу.
 */
export async function refreshWallet() {
  state.isLoading = true
  try {
    const response = await getWallet()
    if (response.isSuccess && response.data) {
      state.balance = response.data.balance ?? 0
      state.totalEarned = response.data.totalEarned ?? 0
      state.totalSpent = response.data.totalSpent ?? 0
    }
  } catch (error) {
    console.error('Ошибка при обновлении кошелька:', error)
  } finally {
    state.isLoading = false
  }
}

export function useWallet() {
  return state
}
