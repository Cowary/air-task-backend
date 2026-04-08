<template>
  <div class="container">
    <!-- Кнопка возврата на главную -->
    <router-link to="/" class="back-button">← На главную</router-link>

    <!-- Заголовок страницы -->
    <h1>🛒 Управление покупками</h1>
    <p class="subtitle">Создание, редактирование и удаление покупок</p>

    <!-- Состояние загрузки -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Загрузка покупок...</p>
    </div>

    <!-- Состояние ошибки -->
    <div v-else-if="error" class="error-message">
      <p>❌ {{ error }}</p>
      <button @click="loadPurchases" class="retry-btn">Повторить</button>
    </div>

    <!-- Основной контент -->
    <div v-else class="content">
      <!-- Панель управления -->
      <div class="toolbar">
        <div class="filter-group">
          <label for="filterCategory">Категория:</label>
          <select id="filterCategory" v-model="filterCategory">
            <option value="">Все категории</option>
            <option v-for="category in uniqueCategories" :key="category" :value="category">
              {{ category }}
            </option>
          </select>

          <label for="filterPriority">Приоритет:</label>
          <select id="filterPriority" v-model="filterPriority">
            <option value="">Все приоритеты</option>
            <option value="HIGH">Высокий</option>
            <option value="MIDDLE">Средний</option>
            <option value="LOW">Низкий</option>
          </select>

          <label for="filterComplete">Статус:</label>
          <select id="filterComplete" v-model="filterComplete">
            <option value="">Все</option>
            <option value="true">Завершенные</option>
            <option value="false">Не завершенные</option>
          </select>
        </div>

        <button @click="openCreateModal" class="create-btn">+ Создать покупку</button>
      </div>

      <!-- Пустое состояние -->
      <div v-if="filteredPurchases.length === 0" class="empty-message">
        <p>{{ purchases.length === 0 ? 'Нет покупок. Создайте первую покупку!' : 'Нет покупок, соответствующих фильтрам' }}</p>
      </div>

      <!-- Список покупок -->
      <div v-else class="purchase-list">
        <div v-for="purchase in filteredPurchases" :key="purchase.id" class="purchase-card">
          <div class="purchase-info">
            <div class="purchase-header">
              <div class="purchase-category" v-if="purchase.category?.name">
                🏷️ {{ purchase.category.name }}
              </div>
              <span class="purchase-priority" :class="`priority-${purchase.priority.toLowerCase()}`">
                {{ getPriorityLabel(purchase.priority) }}
              </span>
              <span v-if="purchase.isComplete" class="complete-badge">✓ Завершено</span>
            </div>

            <div class="purchase-name">{{ purchase.name }}</div>

            <div class="purchase-meta">
              <span class="purchase-date">
                Создано: {{ formatDate(purchase.createdTs) }}
              </span>
            </div>
          </div>

          <div class="purchase-actions">
            <button @click="openEditModal(purchase)" class="action-btn edit-btn" title="Редактировать">✏️</button>
            <button @click="confirmDelete(purchase)" class="action-btn delete-btn" title="Удалить">🗑️</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно для создания/редактирования покупки -->
    <div v-if="showPurchaseModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <h3>{{ editingPurchase ? 'Редактировать покупку' : 'Создать новую покупку' }}</h3>

        <form @submit.prevent="savePurchase" class="purchase-form">
          <div class="form-group">
            <label for="purchaseName">Название покупки *</label>
            <input
              id="purchaseName"
              v-model.trim="purchaseForm.name"
              type="text"
              required
              maxlength="200"
              placeholder="Введите название покупки"
            />
          </div>

          <div class="form-group">
            <label for="purchaseCategory">Категория *</label>
            <input
              id="purchaseCategory"
              v-model.trim="purchaseForm.categoryName"
              type="text"
              required
              maxlength="100"
              placeholder="Введите название категории"
            />
          </div>

          <div class="form-group">
            <label for="purchasePriority">Приоритет *</label>
            <select
              id="purchasePriority"
              v-model="purchaseForm.priority"
              required
            >
              <option value="HIGH">Высокий</option>
              <option value="MIDDLE">Средний</option>
              <option value="LOW">Низкий</option>
            </select>
          </div>

          <div class="form-group" v-if="editingPurchase">
            <label for="purchaseStatus">Статус *</label>
            <select
              id="purchaseStatus"
              v-model="purchaseForm.status"
              required
            >
              <option value="IN_PROGRESS">В работе</option>
              <option value="DONE">Выполнено</option>
              <option value="PAUSED">На паузе</option>
            </select>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                v-model="purchaseForm.isComplete"
              />
              <span>Завершено</span>
            </label>
          </div>

          <div class="form-actions">
            <button type="button" @click="closeModal" class="cancel-btn">Отмена</button>
            <button type="submit" class="save-btn" :disabled="saving">
              {{ saving ? 'Сохранение...' : 'Сохранить' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Модальное окно подтверждения удаления -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
      <div class="modal-content modal-small" @click.stop>
        <h3>Подтверждение удаления</h3>
        <p>Вы уверены, что хотите удалить покупку "{{ purchaseToDelete?.name }}"?</p>
        <div class="form-actions">
          <button @click="closeDeleteModal" class="cancel-btn">Отмена</button>
          <button @click="deletePurchase" class="delete-btn-confirm" :disabled="deleting">
            {{ deleting ? 'Удаление...' : 'Удалить' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getPurchases, createPurchase, updatePurchase, deletePurchase } from '../api/purchases.js';

export default {
  name: 'PurchasesPage',

  data() {
    return {
      purchases: [],
      loading: false,
      error: null,

      // Фильтры
      filterCategory: '',
      filterPriority: '',
      filterComplete: '',

      // Модальное окно покупки
      showPurchaseModal: false,
      editingPurchase: null,
      saving: false,
      purchaseForm: {
        name: '',
        categoryName: '',
        priority: 'MIDDLE',
        isComplete: false,
        status: 'IN_PROGRESS'
      },

      // Модальное окно удаления
      showDeleteModal: false,
      purchaseToDelete: null,
      deleting: false
    };
  },

  computed: {
    uniqueCategories() {
      const categories = new Set();
      this.purchases.forEach(purchase => {
        if (purchase.category?.name) {
          categories.add(purchase.category.name);
        }
      });
      return Array.from(categories).sort();
    },

    filteredPurchases() {
      return this.purchases.filter(purchase => {
        if (this.filterCategory && purchase.category?.name !== this.filterCategory) {
          return false;
        }
        if (this.filterPriority && purchase.priority !== this.filterPriority) {
          return false;
        }
        if (this.filterComplete !== '') {
          const isComplete = this.filterComplete === 'true';
          if (purchase.isComplete !== isComplete) {
            return false;
          }
        }
        return true;
      });
    }
  },

  methods: {
    async loadPurchases() {
      this.loading = true;
      this.error = null;

      try {
        const response = await getPurchases();

        if (response.isSuccess) {
          this.purchases = response.data || [];
        } else {
          this.error = response.errorMessage || 'Неизвестная ошибка';
        }
      } catch (err) {
        this.error = 'Не удалось загрузить список покупок. Проверьте, запущен ли сервер.';
        console.error('Ошибка загрузки покупок:', err);
      } finally {
        this.loading = false;
      }
    },

    getPriorityLabel(priority) {
      const labels = {
        'HIGH': 'Высокий',
        'MIDDLE': 'Средний',
        'LOW': 'Низкий'
      };
      return labels[priority] || priority;
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
      this.editingPurchase = null;
      this.purchaseForm = {
        name: '',
        categoryName: '',
        priority: 'MIDDLE',
        isComplete: false,
        status: 'IN_PROGRESS'
      };
      this.showPurchaseModal = true;
    },

    openEditModal(purchase) {
      this.editingPurchase = purchase;
      this.purchaseForm = {
        name: purchase.name,
        categoryName: purchase.category?.name || '',
        priority: purchase.priority,
        isComplete: purchase.isComplete,
        status: purchase.status || 'IN_PROGRESS'
      };
      this.showPurchaseModal = true;
    },

    closeModal() {
      this.showPurchaseModal = false;
      this.editingPurchase = null;
      this.purchaseForm = {
        name: '',
        categoryName: '',
        priority: 'MIDDLE',
        isComplete: false,
        status: 'IN_PROGRESS'
      };
    },

    async savePurchase() {
      if (!this.purchaseForm.name || !this.purchaseForm.categoryName) {
        alert('Пожалуйста, заполните все обязательные поля');
        return;
      }

      this.saving = true;

      try {
        let response;

        if (this.editingPurchase) {
          response = await updatePurchase({
            id: this.editingPurchase.id,
            name: this.purchaseForm.name,
            categoryName: this.purchaseForm.categoryName,
            priority: this.purchaseForm.priority,
            isComplete: this.purchaseForm.isComplete,
            status: this.purchaseForm.status
          });
        } else {
          response = await createPurchase({
            name: this.purchaseForm.name,
            categoryName: this.purchaseForm.categoryName,
            priority: this.purchaseForm.priority,
            isComplete: this.purchaseForm.isComplete
          });
        }

        if (response.isSuccess) {
          this.closeModal();
          await this.loadPurchases();
        } else {
          alert('Не удалось сохранить покупку: ' + (response.errorMessage || 'Неизвестная ошибка'));
        }
      } catch (err) {
        alert('Ошибка при сохранении покупки');
        console.error('Ошибка сохранения:', err);
      } finally {
        this.saving = false;
      }
    },

    confirmDelete(purchase) {
      this.purchaseToDelete = purchase;
      this.showDeleteModal = true;
    },

    closeDeleteModal() {
      this.showDeleteModal = false;
      this.purchaseToDelete = null;
    },

    async deletePurchase() {
      if (!this.purchaseToDelete) {
        return;
      }

      this.deleting = true;

      try {
        const response = await deletePurchase(this.purchaseToDelete.id);

        if (response.isSuccess) {
          this.closeDeleteModal();
          await this.loadPurchases();
        } else {
          alert('Не удалось удалить покупку: ' + (response.errorMessage || 'Неизвестная ошибка'));
        }
      } catch (err) {
        alert('Ошибка при удалении покупки');
        console.error('Ошибка удаления:', err);
      } finally {
        this.deleting = false;
      }
    }
  },

  mounted() {
    this.loadPurchases();
  }
};
</script>

<style scoped>
.container {
  max-width: 1000px;
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
  margin-bottom: 30px;
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

/* Панель управления */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px;
  background-color: var(--bg-secondary);
  border-radius: 8px;
  flex-wrap: wrap;
  gap: 15px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-group label {
  font-size: 14px;
  color: var(--text-secondary);
}

.filter-group select {
  padding: 6px 12px;
  border: 1px solid var(--border-color);
  border-radius: 5px;
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  font-size: 14px;
}

.create-btn {
  padding: 10px 20px;
  background-color: var(--accent-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.create-btn:hover {
  background-color: #5a6fd6;
}

/* Пустое состояние */
.empty-message {
  text-align: center;
  padding: 40px;
  color: var(--text-muted);
  background-color: var(--bg-tertiary);
  border-radius: 8px;
}

/* Список покупок */
.purchase-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

/* Карточка покупки */
.purchase-card {
  padding: 20px;
  border-radius: 8px;
  background-color: var(--bg-secondary);
  border: 2px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  transition: all 0.2s ease;
}

.purchase-card:hover {
  box-shadow: 0 2px 8px var(--shadow-color);
  border-color: var(--accent-primary);
}

.purchase-info {
  flex: 1;
}

.purchase-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  flex-wrap: wrap;
  gap: 8px;
}

.purchase-category {
  font-size: 12px;
  color: var(--text-secondary);
}

.purchase-name {
  font-size: 18px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 10px;
}

.purchase-meta {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.purchase-priority,
.complete-badge {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 12px;
  font-weight: 500;
}

/* Приоритеты */
.priority-high {
  background-color: var(--accent-red-light);
  color: var(--accent-red);
}

.priority-middle {
  background-color: var(--accent-orange-light);
  color: var(--accent-orange);
}

.priority-low {
  background-color: var(--accent-green-light);
  color: var(--accent-green);
}

.complete-badge {
  background-color: var(--accent-green-light);
  color: var(--accent-green);
}

.purchase-date {
  font-size: 12px;
  color: var(--text-muted);
}

/* Кнопки действий */
.purchase-actions {
  display: flex;
  gap: 8px;
  margin-left: 15px;
}

.action-btn {
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background-color: var(--bg-tertiary);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background-color: var(--border-color);
}

.edit-btn:hover {
  background-color: var(--accent-blue-light);
}

.delete-btn:hover {
  background-color: var(--accent-red-light);
}

/* Модальное окно */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background-color: var(--bg-secondary);
  padding: 30px;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px var(--shadow-color);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-content h3 {
  color: var(--text-primary);
  margin-bottom: 20px;
  text-align: center;
}

.modal-small {
  max-width: 400px;
}

.modal-small p {
  color: var(--text-secondary);
  margin-bottom: 20px;
  text-align: center;
}

/* Форма */
.purchase-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
}

.form-group input,
.form-group select {
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: 5px;
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  font-size: 14px;
  font-family: inherit;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-primary);
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 10px;
}

.cancel-btn,
.save-btn,
.delete-btn-confirm {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.cancel-btn {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
}

.cancel-btn:hover {
  background-color: var(--border-color);
}

.save-btn {
  background-color: var(--accent-primary);
  color: white;
}

.save-btn:hover:not(:disabled) {
  background-color: #5a6fd6;
}

.save-btn:disabled {
  background-color: var(--text-muted);
  cursor: not-allowed;
}

.delete-btn-confirm {
  background-color: var(--accent-red);
  color: white;
}

.delete-btn-confirm:hover:not(:disabled) {
  background-color: #c0392b;
}

.delete-btn-confirm:disabled {
  background-color: var(--text-muted);
  cursor: not-allowed;
}

/* Адаптивность */
@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-group {
    flex-direction: column;
    align-items: stretch;
  }

  .purchase-card {
    flex-direction: column;
  }

  .purchase-actions {
    margin-left: 0;
    margin-top: 15px;
    justify-content: flex-end;
  }
}
</style>
