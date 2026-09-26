<template>
  <div class="date-field">
    <div class="date-field-row">
      <input
        :id="id"
        ref="textInput"
        class="date-field-input"
        type="text"
        inputmode="numeric"
        autocomplete="off"
        :value="text"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        @input="onInput"
        @blur="onBlur"
      />
      <button
        type="button"
        class="date-field-btn"
        :disabled="disabled"
        aria-label="Выбрать дату"
        @click="openPicker"
      >
        <AppIcon name="calendar-days" :size="16" />
      </button>
      <button
        v-if="modelValue"
        type="button"
        class="date-field-btn date-field-clear"
        :disabled="disabled"
        aria-label="Очистить дату"
        @click="clearDate"
      >
        <AppIcon name="x" :size="16" />
      </button>
    </div>
    <input
      ref="nativeInput"
      class="date-field-native"
      type="date"
      tabindex="-1"
      aria-hidden="true"
      :value="modelValue || ''"
      :disabled="disabled"
      @change="onNativeChange"
    />
  </div>
</template>

<script>
import { ref, watch } from 'vue';
import AppIcon from './AppIcon.vue';

/**
 * Поле даты с отображением дд.мм.гггг независимо от локали браузера.
 * v-model — ISO-строка 'yyyy-mm-dd' (или '').
 */
export default {
  name: 'DateField',

  components: { AppIcon },

  props: {
    modelValue: {
      type: String,
      default: ''
    },
    id: {
      type: String,
      default: undefined
    },
    placeholder: {
      type: String,
      default: 'дд.мм.гггг'
    },
    required: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },

  emits: ['update:modelValue'],

  setup(props, { emit }) {
    const textInput = ref(null);
    const nativeInput = ref(null);

    const formatDisplay = (iso) => {
      if (!iso) return '';
      const [year, month, day] = String(iso).slice(0, 10).split('-');
      if (!year || !month || !day) return '';
      return `${day}.${month}.${year}`;
    };

    const parseDisplay = (value) => {
      const match = String(value).replace(/\s/g, '').match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
      if (!match) return null;
      const day = Number(match[1]);
      const month = Number(match[2]);
      const year = Number(match[3]);
      if (year < 1900 || month < 1 || month > 12 || day < 1) return null;
      const maxDay = new Date(year, month, 0).getDate();
      if (day > maxDay) return null;
      return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    };

    const maskDigits = (digits) => {
      if (digits.length > 4) return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
      if (digits.length > 2) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
      return digits;
    };

    const text = ref(formatDisplay(props.modelValue));

    watch(
      () => props.modelValue,
      (value) => {
        if (parseDisplay(text.value) !== (value || null)) {
          text.value = formatDisplay(value);
        }
      }
    );

    const onInput = (event) => {
      const digits = event.target.value.replace(/\D/g, '').slice(0, 8);
      const masked = maskDigits(digits);
      text.value = masked;
      event.target.value = masked;
      emit('update:modelValue', parseDisplay(masked) || '');
    };

    const onBlur = () => {
      if (text.value === '') {
        emit('update:modelValue', '');
        return;
      }
      if (!parseDisplay(text.value)) {
        text.value = formatDisplay(props.modelValue);
      }
    };

    const onNativeChange = (event) => {
      const value = event.target.value || '';
      text.value = formatDisplay(value);
      emit('update:modelValue', value);
    };

    const openPicker = () => {
      const el = nativeInput.value;
      if (!el) return;
      if (typeof el.showPicker === 'function') {
        try {
          el.showPicker();
        } catch {
          el.click();
        }
      } else {
        el.click();
      }
    };

    const clearDate = () => {
      text.value = '';
      emit('update:modelValue', '');
    };

    return {
      textInput,
      nativeInput,
      text,
      onInput,
      onBlur,
      onNativeChange,
      openPicker,
      clearDate
    };
  }
};
</script>

<style scoped>
.date-field-row {
  display: flex;
  align-items: stretch;
  gap: 6px;
}

.date-field-input {
  flex: 1;
  min-width: 0;
}

.date-field-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
  border: 1px solid var(--border-color);
  border-radius: 5px;
  background-color: var(--bg-tertiary);
  color: var(--text-secondary);
  cursor: pointer;
  transition: border-color 0.2s ease, color 0.2s ease;
}

.date-field-btn:hover:not(:disabled) {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

.date-field-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.date-field-clear:hover:not(:disabled) {
  border-color: var(--neon-red, #ff2e6a);
  color: var(--neon-red, #ff2e6a);
}

.date-field-native {
  position: absolute;
  width: 0;
  height: 0;
  padding: 0;
  border: 0;
  opacity: 0;
  pointer-events: none;
}
</style>
