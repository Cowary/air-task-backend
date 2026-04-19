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
              <div class="purchase-category" v-if="purchase.category">
                🏷️ {{ purchase.category }}
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

            <!-- Список цен -->
            <div v-if="purchase.priceList && purchase.priceList.length > 0" class="price-list">
              <div class="meta-title">💰 Цены:</div>
              <div v-for="price in purchase.priceList" :key="price.id" class="price-item">
                <span class="price-amount">{{ formatPrice(price.amount) }} {{ price.currency }}</span>
                <span v-if="price.isActual" class="price-actual-badge">Актуальная</span>
                <span class="price-date">{{ formatDate(price.createdTs) }}</span>
              </div>
            </div>

            <!-- Список ссылок -->
            <div v-if="purchase.linkList && purchase.linkList.length > 0" class="link-list">
              <div class="meta-title">🔗 Ссылки:</div>
              <div v-for="link in purchase.linkList" :key="link.id" class="link-item">
                <a :href="link.link" target="_blank" rel="noopener noreferrer" class="link-url">
                  {{ truncateUrl(link.link) }}
                </a>
              </div>
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
            <div v-if="!isNewCategoryMode" class="category-select-wrapper">
              <select
                id="purchaseCategory"
                v-model="purchaseForm.categoryName"
                required
              >
                <option value="" disabled>Выберите категорию</option>
                <option v-for="category in categories" :key="category" :value="category">
                  {{ category }}
                </option>
              </select>
              <button type="button" @click="enableNewCategoryMode" class="btn-new-category">
                + Новая
              </button>
            </div>
            <div v-else class="category-input-wrapper">
              <input
                id="purchaseNewCategory"
                v-model.trim="newCategoryName"
                type="text"
                placeholder="Введите название новой категории"
                @keyup.enter="confirmNewCategory"
                @blur="confirmNewCategory"
              />
              <button type="button" @click="cancelNewCategoryMode" class="btn-cancel-category">
                ✕
              </button>
            </div>
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

          <!-- Управление ценами -->
          <div class="form-section">
            <label>💰 Цены:</label>
            <div class="list-manager">
              <div v-for="(price, index) in purchaseForm.priceList" :key="index" class="list-item">
                <div class="list-item-content">
                  <input
                    v-model.number="price.amount"
                    type="number"
                    step="0.01"
                    placeholder="Сумма"
                    class="inline-input"
                  />
                  <input
                    v-model.trim="price.currency"
                    type="text"
                    placeholder="Валюта (USD, RUB)"
                    class="inline-input inline-input-short"
                  />
                  <label class="checkbox-label-inline">
                    <input type="checkbox" v-model="price.isActual" />
                    <span>Актуальная</span>
                  </label>
                </div>
                <button @click="removePrice(index)" class="btn-remove" type="button" title="Удалить цену">✕</button>
              </div>
              <button @click="addPrice" class="btn-add" type="button">+ Добавить цену</button>
            </div>
          </div>

          <!-- Управление ссылками -->
          <div class="form-section">
            <label>🔗 Ссылки:</label>
            <div class="list-manager">
              <div v-for="(link, index) in purchaseForm.linkList" :key="index" class="list-item">
                <div class="list-item-content">
                  <input
                    v-model.trim="link.link"
                    type="url"
                    placeholder="https://example.com"
                    class="inline-input"
                  />
                </div>
                <button @click="removeLink(index)" class="btn-remove" type="button" title="Удалить ссылку">✕</button>
              </div>
              <button @click="addLink" class="btn-add" type="button">+ Добавить ссылку</button>
            </div>
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
import { getPurchases, createPurchase, updatePurchase, deletePurchase, getPurchaseCategories } from '../api/purchases.js';

export default {
  name: 'PurchasesPage',

  data() {
    return {
      purchases: [],
      categories: [],
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
        status: 'IN_PROGRESS',
        priceList: [],
        linkList: []
      },
      isNewCategoryMode: false,
      newCategoryName: '',

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
        if (purchase.category) {
          categories.add(purchase.category);
        }
      });
      return Array.from(categories).sort();
    },

    filteredPurchases() {
      return this.purchases.filter(purchase => {
        if (this.filterCategory && purchase.category !== this.filterCategory) {
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

    async loadCategories() {
      try {
        const response = await getPurchaseCategories();

        if (response.isSuccess && response.data) {
          this.categories = response.data.map(cat => typeof cat === 'string' ? cat : cat.name || cat.category);
        }
      } catch (err) {
        console.error('Ошибка загрузки категорий:', err);
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

    formatPrice(amount) {
      if (amount === null || amount === undefined) return '0';
      return new Intl.NumberFormat('ru-RU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    },

    truncateUrl(url, maxLength = 50) {
      if (!url) return '';
      if (url.length <= maxLength) return url;
      return url.substring(0, maxLength) + '...';
    },

    addPrice() {
      this.purchaseForm.priceList.push({
        amount: 0,
        currency: 'RUB',
        isActual: false
      });
    },

    removePrice(index) {
      this.purchaseForm.priceList.splice(index, 1);
    },

    addLink() {
      this.purchaseForm.linkList.push({
        link: ''
      });
    },

    removeLink(index) {
      this.purchaseForm.linkList.splice(index, 1);
    },

    enableNewCategoryMode() {
      this.isNewCategoryMode = true;
      this.newCategoryName = '';
    },

    cancelNewCategoryMode() {
      this.isNewCategoryMode = false;
      this.newCategoryName = '';
    },

    confirmNewCategory() {
      const trimmedName = this.newCategoryName ? this.newCategoryName.trim() : '';
      if (trimmedName) {
        this.purchaseForm.categoryName = trimmedName;
        if (!this.categories.includes(trimmedName)) {
          this.categories.push(trimmedName);
          this.categories.sort();
        }
      }
      this.isNewCategoryMode = false;
      this.newCategoryName = '';
    },

    openCreateModal() {
      this.editingPurchase = null;
      this.purchaseForm = {
        name: '',
        categoryName: '',
        priority: 'MIDDLE',
        isComplete: false,
        status: 'IN_PROGRESS',
        priceList: [],
        linkList: []
      };
      this.isNewCategoryMode = false;
      this.newCategoryName = '';
      this.showPurchaseModal = true;
    },

    openEditModal(purchase) {
      this.editingPurchase = purchase;
      this.purchaseForm = {
        name: purchase.name,
        categoryName: purchase.category || '',
        priority: purchase.priority,
        isComplete: purchase.isComplete,
        status: purchase.status || 'IN_PROGRESS',
        priceList: purchase.priceList ? JSON.parse(JSON.stringify(purchase.priceList)) : [],
        linkList: purchase.linkList ? JSON.parse(JSON.stringify(purchase.linkList)) : []
      };
      this.isNewCategoryMode = false;
      this.newCategoryName = '';
      this.showPurchaseModal = true;
    },

    closeModal() {
      this.isNewCategoryMode = false;
      this.newCategoryName = '';
      this.showPurchaseModal = false;
      this.editingPurchase = null;
      this.purchaseForm = {
        name: '',
        categoryName: '',
        priority: 'MIDDLE',
        isComplete: false,
        status: 'IN_PROGRESS',
        priceList: [],
        linkList: []
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
            status: this.purchaseForm.status,
            priceList: this.purchaseForm.priceList,
            linkList: this.purchaseForm.linkList
          });
        } else {
          response = await createPurchase({
            name: this.purchaseForm.name,
            categoryName: this.purchaseForm.categoryName,
            priority: this.purchaseForm.priority,
            isComplete: this.purchaseForm.isComplete,
            priceList: this.purchaseForm.priceList,
            linkList: this.purchaseForm.linkList
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
    this.loadCategories();
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

/* Списки цен и ссылок */
.meta-title {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-top: 8px;
  margin-bottom: 4px;
}

.price-list,
.link-list {
  margin-top: 8px;
}

.price-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 12px;
}

.price-amount {
  font-weight: 500;
  color: var(--text-primary);
}

.price-actual-badge {
  background-color: var(--accent-green-light);
  color: var(--accent-green);
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 8px;
}

.price-date {
  color: var(--text-muted);
  font-size: 11px;
}

.link-item {
  padding: 4px 0;
}

.link-url {
  color: var(--accent-primary);
  text-decoration: none;
  font-size: 12px;
  word-break: break-all;
}

.link-url:hover {
  text-decoration: underline;
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

/* Секция формы */
.form-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
  padding: 12px;
  background-color: var(--bg-tertiary);
  border-radius: 6px;
}

.form-section label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
}

.category-select-wrapper {
  display: flex;
  gap: 10px;
}

.category-select-wrapper select {
  flex: 1;
}

.btn-new-category {
  padding: 10px 15px;
  background-color: var(--accent-primary);
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
  transition: background-color 0.2s;
}

.btn-new-category:hover {
  background-color: #5a6fd6;
}

.category-input-wrapper {
  display: flex;
  gap: 10px;
  align-items: center;
}

.category-input-wrapper input {
  flex: 1;
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: 5px;
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  font-size: 14px;
  font-family: inherit;
}

.category-input-wrapper input:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.btn-cancel-category {
  padding: 8px 12px;
  background-color: var(--accent-red);
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
}

.btn-cancel-category:hover {
  background-color: #e74c3c;
}

/* Менеджер списков */
.list-manager {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.list-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: var(--bg-secondary);
  padding: 8px;
  border-radius: 4px;
}

.list-item-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.inline-input {
  padding: 6px 10px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  font-size: 13px;
  flex: 1;
}

.inline-input:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.inline-input-short {
  max-width: 100px;
  flex: none;
}

.checkbox-label-inline {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  font-size: 12px;
  color: var(--text-primary);
  white-space: nowrap;
}

.checkbox-label-inline input[type="checkbox"] {
  width: 14px;
  height: 14px;
  cursor: pointer;
}

.btn-remove {
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background-color: var(--accent-red-light);
  color: var(--accent-red);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.btn-remove:hover {
  background-color: var(--accent-red);
  color: white;
}

.btn-add {
  padding: 6px 12px;
  border: 1px dashed var(--border-color);
  border-radius: 4px;
  background-color: transparent;
  color: var(--accent-primary);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;
}

.btn-add:hover {
  border-color: var(--accent-primary);
  background-color: var(--bg-secondary);
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
