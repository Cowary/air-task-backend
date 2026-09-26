import apiClient from './client';

/**
 * Получает кошелёк монет (баланс и суммарные начисления/траты)
 *
 * API endpoint: GET /gamification/v1/wallet
 *
 * @returns {Promise} Промис с обёрткой { isSuccess, data, errorMessage }
 */
export const getWallet = async () => {
  try {
    const response = await apiClient.get('/gamification/v1/wallet');
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении кошелька:', error);
    throw error;
  }
};

/**
 * Получает историю операций с монетами (новые сверху)
 *
 * API endpoint: GET /gamification/v1/transactions
 *
 * @returns {Promise} Промис с обёрткой { isSuccess, data, errorMessage }
 */
export const getTransactions = async () => {
  try {
    const response = await apiClient.get('/gamification/v1/transactions');
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении истории монет:', error);
    throw error;
  }
};

/**
 * Получает тарифы начисления монет
 *
 * API endpoint: GET /gamification/v1/settings
 *
 * @returns {Promise} Промис с обёрткой { isSuccess, data, errorMessage }
 */
export const getGamificationSettings = async () => {
  try {
    const response = await apiClient.get('/gamification/v1/settings');
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении настроек геймификации:', error);
    throw error;
  }
};

/**
 * Обновляет тарифы начисления монет
 *
 * API endpoint: PUT /gamification/v1/settings
 *
 * @param {Object} settings - Тарифы; null-поля сохраняют текущее значение
 * @param {number} [settings.taskRewardHigh] - Монеты за HIGH-задачу
 * @param {number} [settings.taskRewardMiddle] - Монеты за MIDDLE-задачу
 * @param {number} [settings.taskRewardLow] - Монеты за LOW-задачу
 * @param {number} [settings.weeklyRewardHigh] - Монеты за HIGH weekly-задачу
 * @param {number} [settings.weeklyRewardMiddle] - Монеты за MIDDLE weekly-задачу
 * @param {number} [settings.weeklyRewardLow] - Монеты за LOW weekly-задачу
 * @param {number} [settings.subtaskReward] - Монеты за подзадачу
 * @param {number} [settings.projectBonusPercent] - Бонус проекта в % от суммы тарифов задач
 * @returns {Promise} Промис с обёрткой { isSuccess, data, errorMessage }
 */
export const updateGamificationSettings = async (settings) => {
  try {
    const response = await apiClient.put('/gamification/v1/settings', settings);
    return response.data;
  } catch (error) {
    console.error('Ошибка при сохранении настроек геймификации:', error);
    throw error;
  }
};
