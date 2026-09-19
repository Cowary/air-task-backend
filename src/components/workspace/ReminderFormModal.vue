<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <h3>{{ isEdit ? 'Редактировать напоминание' : 'Новое напоминание' }}</h3>

        <form @submit.prevent="handleSave" class="reminder-form">
          <div class="form-group">
            <label for="reminderName">Название *</label>
            <input
              id="reminderName"
              v-model.trim="form.name"
              type="text"
              required
              maxlength="200"
              placeholder="Например, заменить масло в машине"
            />
          </div>

          <div class="form-group">
            <label for="reminderDescription">Описание</label>
            <textarea
              id="reminderDescription"
              v-model="form.description"
              placeholder="Детали (опционально)"
              maxlength="10000"
              rows="3"
            ></textarea>
          </div>

          <div class="form-group">
            <label for="reminderType">Тип повторения *</label>
            <select id="reminderType" v-model="form.recurrenceType">
              <option v-for="option in typeOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>

          <div v-if="isInterval" class="form-group">
            <label>Повторять каждые *</label>
            <div class="interval-row">
              <input
                v-model.number="form.intervalValue"
                type="number"
                min="1"
                max="365"
                required
                class="interval-value"
              />
              <select v-model="form.intervalUnit" class="interval-unit">
                <option value="DAYS">дней</option>
                <option value="MONTHS">месяцев</option>
                <option value="YEARS">лет</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label for="reminderStartDate">{{ startDateLabel }}</label>
            <input id="reminderStartDate" v-model="form.startDate" type="date" required />
            <span class="form-hint">{{ startDateHint }}</span>
          </div>

          <div v-if="!isEdit && isInterval" class="form-group">
            <label>Уже прошло (часть интервала)</label>
            <div class="interval-row">
              <input
                v-model.number="form.elapsedValue"
                type="number"
                min="0"
                max="365"
                class="interval-value"
              />
              <select v-model="form.elapsedUnit" class="interval-unit">
                <option value="DAYS">дней</option>
                <option value="MONTHS">месяцев</option>
                <option value="YEARS">лет</option>
              </select>
            </div>
            <span class="form-hint">
              Например: каждые 3 месяца, но 10 дней уже прошло.
            </span>
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
import { createReminder, updateReminder } from '../../api/reminders.js';

export default {
  name: 'ReminderFormModal',

  props: {
    visible: {
      type: Boolean,
      required: true
    },
    reminder: {
      type: Object,
      default: null
    }
  },

  emits: ['close', 'saved'],

  data() {
    return {
      saving: false,
      typeOptions: [
        { value: 'INTERVAL', label: 'Каждые N дней/месяцев/лет' },
        { value: 'MONTHLY', label: 'Ежемесячно в определённое число' },
        { value: 'ANNUAL', label: 'Ежегодно в определённую дату' },
        { value: 'ONCE', label: 'Один раз в конкретную дату' }
      ],
      form: {
        name: '',
        description: '',
        recurrenceType: 'INTERVAL',
        intervalValue: 1,
        intervalUnit: 'DAYS',
        startDate: '',
        elapsedValue: 0,
        elapsedUnit: 'DAYS'
      }
    };
  },

  computed: {
    isEdit() {
      return !!this.reminder;
    },

    isInterval() {
      return this.form.recurrenceType === 'INTERVAL';
    },

    startDateLabel() {
      switch (this.form.recurrenceType) {
        case 'INTERVAL':
          return 'Начало отсчёта *';
        case 'MONTHLY':
          return 'День месяца (ориентир) *';
        case 'ANNUAL':
          return 'Дата (используются месяц и день) *';
        default:
          return 'Дата *';
      }
    },

    startDateHint() {
      switch (this.form.recurrenceType) {
        case 'INTERVAL':
          return 'Следующий срок считается от этой даты и от факта выполнения.';
        case 'MONTHLY':
          return 'Напоминание будет повторяться каждый месяц в это число.';
        case 'ANNUAL':
          return 'Напоминание будет повторяться ежегодно в этот месяц и день.';
        default:
          return 'Разовое напоминание на указанную дату.';
      }
    }
  },

  watch: {
    visible(newVisible) {
      if (newVisible) {
        this.initForm();
      }
    }
  },

  methods: {
    todayIso() {
      const now = new Date();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      return `${now.getFullYear()}-${month}-${day}`;
    },

    subtractElapsed(baseIso, value, unit) {
      const date = new Date(`${baseIso}T00:00:00`);
      if (unit === 'MONTHS') {
        date.setMonth(date.getMonth() - value);
      } else if (unit === 'YEARS') {
        date.setFullYear(date.getFullYear() - value);
      } else {
        date.setDate(date.getDate() - value);
      }
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${date.getFullYear()}-${month}-${day}`;
    },

    initForm() {
      if (this.reminder) {
        this.form = {
          name: this.reminder.name || '',
          description: this.reminder.description || '',
          recurrenceType: this.reminder.recurrenceType || 'INTERVAL',
          intervalValue: this.reminder.intervalValue ?? 1,
          intervalUnit: this.reminder.intervalUnit || 'DAYS',
          startDate: this.reminder.startDate || this.todayIso(),
          elapsedValue: 0,
          elapsedUnit: this.reminder.intervalUnit || 'DAYS'
        };
        return;
      }

      this.form = {
        name: '',
        description: '',
        recurrenceType: 'INTERVAL',
        intervalValue: 1,
        intervalUnit: 'DAYS',
        startDate: this.todayIso(),
        elapsedValue: 0,
        elapsedUnit: 'DAYS'
      };
    },

    closeModal() {
      this.$emit('close');
    },

    async handleSave() {
      if (!this.form.name) {
        alert('Пожалуйста, заполните название');
        return;
      }
      if (!this.form.startDate) {
        alert('Укажите дату');
        return;
      }
      if (this.isInterval && (!this.form.intervalValue || this.form.intervalValue < 1)) {
        alert('Укажите интервал больше 0');
        return;
      }

      let startDate = this.form.startDate;
      if (!this.isEdit && this.isInterval && this.form.elapsedValue > 0) {
        startDate = this.subtractElapsed(this.todayIso(), this.form.elapsedValue, this.form.elapsedUnit);
      }

      const payload = {
        name: this.form.name,
        description: this.form.description,
        recurrenceType: this.form.recurrenceType,
        intervalValue: this.isInterval ? Number(this.form.intervalValue) : null,
        intervalUnit: this.isInterval ? this.form.intervalUnit : null,
        startDate
      };

      this.saving = true;
      try {
        const response = this.isEdit
          ? await updateReminder(this.reminder.id, payload)
          : await createReminder(payload);

        if (response.isSuccess) {
          this.$emit('saved', response.data);
          this.closeModal();
        } else {
          alert('Не удалось сохранить напоминание: ' + (response.errorMessage || 'Неизвестная ошибка'));
        }
      } catch (err) {
        alert('Ошибка при сохранении напоминания');
        console.error('Ошибка сохранения напоминания:', err);
      } finally {
        this.saving = false;
      }
    }
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
  max-width: 540px;
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

.reminder-form {
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
.form-group textarea,
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
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.form-group textarea {
  resize: vertical;
}

.interval-row {
  display: flex;
  gap: 8px;
}

.interval-value {
  width: 100px;
}

.interval-unit {
  flex: 1;
}

.form-hint {
  font-size: 12px;
  color: var(--text-muted);
  font-style: italic;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 10px;
}

.cancel-btn,
.save-btn {
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
  color: var(--on-neon);
}

.save-btn:hover:not(:disabled) {
  filter: brightness(1.12);
}

.save-btn:disabled {
  background-color: var(--text-muted);
  cursor: not-allowed;
}
</style>
