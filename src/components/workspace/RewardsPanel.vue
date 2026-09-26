<template>
  <section class="rewards-panel">
    <header class="rewards-head">
      <div class="rewards-head-text">
        <h2 class="rewards-title">
          <AppIcon name="wallet" :size="18" aria-hidden="true" />
          Награды
        </h2>
        <p class="rewards-subtitle">
          Копите монеты за задачи и проекты — тратьте на постоянные награды и покупки из списка.
        </p>
      </div>
      <router-link to="/settings" class="settings-link">
        <AppIcon name="settings" :size="14" aria-hidden="true" />
        Тарифы
      </router-link>
    </header>

    <div v-if="loading" class="empty-message">Загрузка...</div>
    <div v-else-if="loadError" class="load-error">
      <AppIcon name="triangle-alert" :size="16" aria-hidden="true" />
      <span>{{ loadError }}</span>
    </div>

    <template v-else>
      <!-- Кошелёк -->
      <div class="wallet-card">
        <div class="wallet-balance-block">
          <span class="hud-label">Баланс</span>
          <div class="wallet-balance">
            <AppIcon name="coins" :size="22" aria-hidden="true" />
            <span class="wallet-balance-value">{{ wallet.balance ?? 0 }}</span>
          </div>
        </div>
        <div class="wallet-totals">
          <span class="wallet-chip wallet-chip-earn">
            <AppIcon name="arrow-up" :size="12" aria-hidden="true" />
            Заработано: {{ wallet.totalEarned ?? 0 }}
          </span>
          <span class="wallet-chip wallet-chip-spend">
            <AppIcon name="arrow-down" :size="12" aria-hidden="true" />
            Потрачено: {{ wallet.totalSpent ?? 0 }}
          </span>
        </div>
      </div>

      <!-- Постоянные награды -->
      <div class="rewards-section">
        <div class="section-head">
          <h3 class="section-title">
            <AppIcon name="gift" :size="16" aria-hidden="true" />
            Постоянные награды
          </h3>
          <button type="button" class="create-btn" @click="openCreateModal">
            <AppIcon name="plus" :size="14" aria-hidden="true" />
            Добавить
          </button>
        </div>

        <p v-if="rewards.length === 0" class="empty-message">
          Постоянных наград пока нет. Добавьте первую — например, «Шоколадка».
        </p>

        <ul v-else class="reward-list">
          <li
            v-for="reward in rewards"
            :key="reward.id"
            class="reward-card"
          >
            <div class="reward-info">
              <div class="reward-name-row">
                <span class="reward-name">{{ reward.name }}</span>
                <span class="badge" :class="`priority-${reward.priority.toLowerCase()}`">
                  {{ priorityLabel(reward.priority) }}
                </span>
              </div>
              <p v-if="reward.description" class="reward-description">{{ reward.description }}</p>
              <span class="reward-cost">
                <AppIcon name="coins" :size="14" aria-hidden="true" />
                {{ reward.cost }} монет
              </span>
            </div>
            <div class="reward-actions">
              <button
                type="button"
                class="buy-btn"
                :disabled="buyingId === reward.id"
                :aria-label="`Купить «${reward.name}» за ${reward.cost} монет`"
                @click="buyRewardItem(reward)"
              >
                <AppIcon name="shopping-cart" :size="14" aria-hidden="true" />
                {{ buyingId === reward.id ? 'Покупка...' : 'Купить' }}
              </button>
              <button
                type="button"
                class="icon-btn"
                title="Редактировать"
                :aria-label="`Редактировать «${reward.name}»`"
                @click="openEditModal(reward)"
              >
                <AppIcon name="pencil" :size="14" aria-hidden="true" />
              </button>
              <button
                type="button"
                class="icon-btn danger"
                title="Удалить"
                :aria-label="`Удалить «${reward.name}»`"
                @click="confirmDelete(reward)"
              >
                <AppIcon name="trash-2" :size="14" aria-hidden="true" />
              </button>
            </div>
          </li>
        </ul>
      </div>

      <!-- Разовые покупки -->
      <div class="rewards-section">
        <div class="section-head">
          <h3 class="section-title">
            <AppIcon name="shopping-cart" :size="16" aria-hidden="true" />
            Разовые покупки из списка
          </h3>
          <router-link to="/purchases" class="settings-link">
            К списку покупок
          </router-link>
        </div>

        <p v-if="buyablePurchases.length === 0" class="empty-message">
          Нет покупок с ценой в монетах. Задайте её в разделе «Покупки».
        </p>

        <ul v-else class="reward-list">
          <li
            v-for="purchase in buyablePurchases"
            :key="purchase.id"
            class="reward-card"
          >
            <div class="reward-info">
              <div class="reward-name-row">
                <span class="reward-name">{{ purchase.name }}</span>
                <span class="badge" :class="`priority-${purchase.priority.toLowerCase()}`">
                  {{ priorityLabel(purchase.priority) }}
                </span>
              </div>
              <span class="reward-cost">
                <AppIcon name="coins" :size="14" aria-hidden="true" />
                {{ purchase.coinCost }} монет
              </span>
              <span class="reward-once-hint">разовая покупка</span>
            </div>
            <div class="reward-actions">
              <button
                type="button"
                class="buy-btn"
                :disabled="buyingId === purchase.id"
                :aria-label="`Купить «${purchase.name}» за ${purchase.coinCost} монет`"
                @click="buyPurchaseItem(purchase)"
              >
                <AppIcon name="shopping-cart" :size="14" aria-hidden="true" />
                {{ buyingId === purchase.id ? 'Покупка...' : 'Купить' }}
              </button>
            </div>
          </li>
        </ul>
      </div>

      <!-- История операций -->
      <div class="rewards-section">
        <div class="section-head">
          <h3 class="section-title">
            <AppIcon name="history" :size="16" aria-hidden="true" />
            История операций
          </h3>
        </div>

        <p v-if="transactions.length === 0" class="empty-message">
          Операций пока нет. Выполните задачу, чтобы заработать первые монеты.
        </p>

        <ul v-else class="transaction-list">
          <li
            v-for="transaction in transactions"
            :key="transaction.id"
            class="transaction-row"
          >
            <span class="transaction-amount" :class="transaction.amount >= 0 ? 'is-earn' : 'is-spend'">
              {{ transaction.amount >= 0 ? '+' : '−' }}{{ Math.abs(transaction.amount) }}
            </span>
            <span class="transaction-body">
              <span class="transaction-desc">
                {{ sourceLabel(transaction.sourceType) }}: {{ transaction.description }}
              </span>
              <span class="transaction-date">{{ formatDate(transaction.createdTs) }}</span>
            </span>
          </li>
        </ul>
      </div>
    </template>

    <RewardFormModal
      :visible="showModal"
      :reward="editingReward"
      @close="closeModal"
      @saved="handleSaved"
    />

    <Teleport to="body">
      <div v-if="rewardToDelete" class="modal-overlay" @click="closeDeleteModal">
        <div class="modal-content" @click.stop>
          <h3>Удалить награду?</h3>
          <p class="delete-text">Награда «{{ rewardToDelete.name }}» будет удалена безвозвратно.</p>
          <div class="form-actions">
            <button type="button" class="cancel-btn" @click="closeDeleteModal">Отмена</button>
            <button type="button" class="confirm-delete-btn" :disabled="deleting" @click="deleteRewardItem">
              {{ deleting ? 'Удаление...' : 'Удалить' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<script>
import AppIcon from '../AppIcon.vue';
import RewardFormModal from './RewardFormModal.vue';
import { getRewards, deleteReward, buyReward } from '../../api/rewards.js';
import { getTransactions, getWallet } from '../../api/gamification.js';
import { getPurchases, buyPurchase } from '../../api/purchases.js';
import { useWallet, refreshWallet } from '../../store/wallet.js';

export default {
  name: 'RewardsPanel',

  components: {
    AppIcon,
    RewardFormModal
  },

  emits: ['changed'],

  data() {
    return {
      loading: false,
      loadError: null,

      rewards: [],
      purchases: [],
      transactions: [],
      wallet: useWallet(),

      showModal: false,
      editingReward: null,

      buyingId: null,
      rewardToDelete: null,
      deleting: false
    };
  },

  computed: {
    buyablePurchases() {
      return this.purchases
        .filter(purchase => purchase.coinCost != null && !purchase.isComplete)
        .sort((a, b) => (a.coinCost ?? 0) - (b.coinCost ?? 0));
    }
  },

  methods: {
    async load() {
      this.loading = true;
      this.loadError = null;
      try {
        const [rewardsRes, purchasesRes, transactionsRes, walletRes] = await Promise.all([
          getRewards(),
          getPurchases(),
          getTransactions(),
          getWallet()
        ]);

        const failed = [rewardsRes, purchasesRes, transactionsRes, walletRes]
          .find(response => !response.isSuccess);
        if (failed) {
          this.loadError = failed.errorMessage || 'Не удалось загрузить данные';
          return;
        }

        this.rewards = rewardsRes.data || [];
        this.purchases = purchasesRes.data || [];
        this.transactions = transactionsRes.data || [];
        if (walletRes.data) {
          this.wallet.balance = walletRes.data.balance ?? 0;
          this.wallet.totalEarned = walletRes.data.totalEarned ?? 0;
          this.wallet.totalSpent = walletRes.data.totalSpent ?? 0;
        }
      } catch (error) {
        console.error('Ошибка загрузки наград:', error);
        this.loadError = 'Не удалось загрузить данные. Проверьте, запущен ли сервер.';
      } finally {
        this.loading = false;
      }
    },

    priorityLabel(priority) {
      const labels = { HIGH: 'Высокий', MIDDLE: 'Средний', LOW: 'Низкий' };
      return labels[priority] || priority;
    },

    sourceLabel(sourceType) {
      const labels = {
        TASK: 'Задача',
        SUBTASK: 'Подзадача',
        WEEKLY: 'Неделя',
        PROJECT: 'Проект',
        REWARD: 'Награда',
        PURCHASE: 'Покупка'
      };
      return labels[sourceType] || sourceType;
    },

    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },

    openCreateModal() {
      this.editingReward = null;
      this.showModal = true;
    },

    openEditModal(reward) {
      this.editingReward = reward;
      this.showModal = true;
    },

    closeModal() {
      this.showModal = false;
      this.editingReward = null;
    },

    async handleSaved() {
      this.closeModal();
      await this.load();
      this.$emit('changed');
    },

    async buyRewardItem(reward) {
      this.buyingId = reward.id;
      try {
        const response = await buyReward(reward.id);
        if (response.isSuccess) {
          await this.load();
          await refreshWallet();
          this.$emit('changed');
        } else {
          alert(response.errorMessage || 'Не удалось купить награду');
        }
      } catch (error) {
        alert('Ошибка при покупке награды');
        console.error('Ошибка покупки награды:', error);
      } finally {
        this.buyingId = null;
      }
    },

    async buyPurchaseItem(purchase) {
      this.buyingId = purchase.id;
      try {
        const response = await buyPurchase(purchase.id);
        if (response.isSuccess) {
          await this.load();
          await refreshWallet();
          this.$emit('changed');
        } else {
          alert(response.errorMessage || 'Не удалось купить покупку');
        }
      } catch (error) {
        alert('Ошибка при покупке');
        console.error('Ошибка покупки:', error);
      } finally {
        this.buyingId = null;
      }
    },

    confirmDelete(reward) {
      this.rewardToDelete = reward;
    },

    closeDeleteModal() {
      this.rewardToDelete = null;
    },

    async deleteRewardItem() {
      if (!this.rewardToDelete) return;
      this.deleting = true;
      try {
        const response = await deleteReward(this.rewardToDelete.id);
        if (response.isSuccess) {
          this.closeDeleteModal();
          await this.load();
          this.$emit('changed');
        } else {
          alert(response.errorMessage || 'Не удалось удалить награду');
        }
      } catch (error) {
        alert('Ошибка при удалении награды');
        console.error('Ошибка удаления награды:', error);
      } finally {
        this.deleting = false;
      }
    }
  },

  mounted() {
    this.load();
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--overlay-scrim);
  backdrop-filter: blur(3px);
  display: flex;
  justify-content: center;
  align-items: center;
  overflow-y: auto;
  z-index: 1100;
  animation: screen-fade var(--transition-base);
}

.modal-content {
  background-color: var(--bg-secondary);
  border: 1px solid color-mix(in srgb, var(--neon-violet) 40%, var(--border-light));
  padding: 30px;
  border-radius: var(--radius-lg);
  max-width: 520px;
  width: 92%;
  max-height: 90vh;
  overflow-y: auto;
  margin: auto;
  box-shadow: var(--shadow-elevated), var(--glow-violet);
  animation: screen-rise var(--transition-slow);
}

.modal-content h3 {
  color: var(--text-primary);
  margin-bottom: 20px;
  text-align: center;
}

.rewards-panel {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.rewards-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.rewards-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-family: var(--font-display);
  font-size: 20px;
  color: var(--text-primary);
}

.rewards-title :deep(svg) {
  color: var(--entity-rewards);
}

.rewards-subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--text-muted);
}

.settings-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  font-family: var(--font-mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  text-decoration: none;
  transition: color var(--transition-base), border-color var(--transition-base),
    box-shadow var(--transition-base);
}

.settings-link:hover {
  color: var(--entity-rewards);
  border-color: var(--entity-rewards);
  box-shadow: var(--glow-rewards);
}

.wallet-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 18px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-left: 3px solid var(--entity-rewards);
  border-radius: var(--radius-md);
}

.wallet-balance {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--entity-rewards);
}

.wallet-balance-value {
  font-family: var(--font-mono);
  font-size: 28px;
  font-weight: 600;
  color: var(--text-primary);
}

.wallet-totals {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.wallet-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 8px;
  font-family: var(--font-mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border: 1px solid color-mix(in srgb, currentColor 45%, transparent);
  border-radius: 10px;
}

.wallet-chip-earn {
  color: var(--accent-green);
  background: var(--accent-green-light);
}

.wallet-chip-spend {
  color: var(--accent-red);
  background: var(--accent-red-light);
}

.rewards-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-family: var(--font-display);
  font-size: 15px;
  color: var(--text-primary);
}

.section-title :deep(svg) {
  color: var(--entity-rewards);
}

.create-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-family: var(--font-mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--on-neon);
  background: var(--neon-magenta);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: box-shadow var(--transition-base), transform var(--transition-fast);
}

.create-btn:hover {
  box-shadow: var(--glow-magenta);
}

.create-btn:active {
  transform: translateY(1px);
}

.reward-list,
.transaction-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reward-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 12px 14px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-left: 3px solid var(--entity-rewards);
  border-radius: var(--radius-md);
  transition: border-color var(--transition-base), box-shadow var(--transition-base),
    transform var(--transition-fast);
}

.reward-card:hover {
  border-color: var(--entity-rewards);
  box-shadow: var(--glow-rewards);
  transform: translateY(-2px);
}

.reward-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.reward-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.reward-name {
  font-family: var(--font-display);
  font-size: 15px;
  color: var(--text-primary);
  overflow-wrap: anywhere;
}

.reward-description {
  margin: 0;
  font-size: 13px;
  color: var(--text-muted);
  overflow-wrap: anywhere;
}

.reward-cost,
.reward-once-hint {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--entity-rewards);
}

.reward-once-hint {
  color: var(--text-muted);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.reward-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.buy-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 34px;
  padding: 0 12px;
  font-family: var(--font-mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--entity-rewards);
  background: var(--accent-rewards-light);
  border: 1px solid color-mix(in srgb, var(--entity-rewards) 45%, transparent);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: border-color var(--transition-base), box-shadow var(--transition-base),
    transform var(--transition-fast);
}

.buy-btn:hover:not(:disabled) {
  border-color: var(--entity-rewards);
  box-shadow: var(--glow-rewards);
}

.buy-btn:active:not(:disabled) {
  transform: translateY(1px);
}

.buy-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  color: var(--text-secondary);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: color var(--transition-base), border-color var(--transition-base),
    box-shadow var(--transition-base);
}

.icon-btn:hover {
  color: var(--neon-violet);
  border-color: var(--accent-purple);
  box-shadow: var(--glow-violet);
}

.icon-btn.danger:hover {
  color: var(--neon-red);
  border-color: var(--accent-red);
  box-shadow: var(--glow-red);
}

.transaction-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
}

.transaction-amount {
  min-width: 52px;
  font-family: var(--font-mono);
  font-size: 14px;
  text-align: right;
}

.transaction-amount.is-earn {
  color: var(--accent-green);
}

.transaction-amount.is-spend {
  color: var(--accent-red);
}

.transaction-body {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.transaction-desc {
  font-size: 13px;
  color: var(--text-primary);
  overflow-wrap: anywhere;
}

.transaction-date {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-muted);
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  font-family: var(--font-mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border: 1px solid color-mix(in srgb, currentColor 45%, transparent);
  border-radius: 10px;
}

.priority-high {
  color: var(--accent-red);
  background: var(--accent-red-light);
}

.priority-middle {
  color: var(--accent-orange);
  background: var(--accent-orange-light);
}

.priority-low {
  color: var(--accent-gray);
  background: var(--accent-gray-light);
}

.empty-message {
  margin: 0;
  padding: 14px;
  font-size: 13px;
  color: var(--text-muted);
  text-align: center;
  background: var(--bg-secondary);
  border: 1px dashed var(--border-color);
  border-radius: var(--radius-md);
}

.load-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  color: var(--neon-red);
  background: var(--accent-red-light);
  border: 1px solid var(--accent-red);
  border-radius: var(--radius-md);
}

.delete-text {
  color: var(--text-secondary);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
}

.cancel-btn {
  padding: 8px 14px;
  font-family: var(--font-mono);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-secondary);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.confirm-delete-btn {
  padding: 8px 14px;
  font-family: var(--font-mono);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--on-neon);
  background: var(--neon-red);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.confirm-delete-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .wallet-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .reward-card {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
