<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <h3>{{ isEdit ? 'Редактировать награду' : 'Создать награду' }}</h3>

        <form @submit.prevent="handleSave" class="reward-form">
          <div class="form-group">
            <label for="rewardName">Название *</label>
            <input
              id="rewardName"
              v-model.trim="form.name"
              type="text"
              required
              maxlength="200"
              placeholder="Например, Шоколадка"
            />
          </div>

          <div class="form-group">
            <label for="rewardDescription">Описание</label>
            <textarea
              id="rewardDescription"
              v-model.trim="form.description"
              maxlength="10000"
              rows="3"
              placeholder="Необязательно"
            ></textarea>
          </div>

          <div class="form-group">
            <label for="rewardCost">Цена в монетах *</label>
            <input
              id="rewardCost"
              v-model.number="form.cost"
              type="number"
              required
              min="1"
              step="1"
              placeholder="15"
            />
          </div>

          <div class="form-group">
            <label for="rewardPriority">Приоритет *</label>
            <select id="rewardPriority" v-model="form.priority" required>
              <option value="HIGH">Высокий</option>
              <option value="MIDDLE">Средний</option>
              <option value="LOW">Низкий</option>
            </select>
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
  </Teleport>
</template>

<script>
import { createReward, updateReward } from '../../api/rewards.js';

export default {
  name: 'RewardFormModal',

  props: {
    visible: {
      type: Boolean,
      required: true
    },
    reward: {
      type: Object,
      default: null
    }
  },

  emits: ['close', 'saved'],

  data() {
    return {
      saving: false,
      form: this.blankForm()
    };
  },

  computed: {
    isEdit() {
      return !!(this.reward && this.reward.id);
    }
  },

  watch: {
    visible(value) {
      if (value) {
        this.initForm();
      }
    }
  },

  methods: {
    blankForm() {
      return {
        name: '',
        description: '',
        cost: 10,
        priority: 'MIDDLE'
      };
    },

    initForm() {
      if (this.isEdit) {
        this.form = {
          name: this.reward.name,
          description: this.reward.description || '',
          cost: this.reward.cost,
          priority: this.reward.priority
        };
      } else {
        this.form = this.blankForm();
      }
    },

    closeModal() {
      this.$emit('close');
    },

    async handleSave() {
      if (!this.form.name || !this.form.cost || this.form.cost < 1) {
        alert('Пожалуйста, заполните название и цену в монетах');
        return;
      }

      this.saving = true;
      try {
        const payload = {
          name: this.form.name,
          description: this.form.description || null,
          cost: this.form.cost,
          priority: this.form.priority
        };
        const response = this.isEdit
          ? await updateReward(this.reward.id, payload)
          : await createReward(payload);

        if (response.isSuccess) {
          this.$emit('saved', response.data);
        } else {
          alert(response.errorMessage || 'Не удалось сохранить награду');
        }
      } catch (error) {
        alert('Ошибка при сохранении награды');
        console.error('Ошибка сохранения награды:', error);
      } finally {
        this.saving = false;
      }
    }
  }
};
</script>

<style scoped>
.reward-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-family: var(--font-mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-secondary);
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 8px 10px;
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--text-primary);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: 2px solid var(--neon-cyan);
  outline-offset: 1px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 6px;
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

.save-btn {
  padding: 8px 14px;
  font-family: var(--font-mono);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--on-neon);
  background: var(--neon-magenta);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
