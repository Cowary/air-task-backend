<template>
  <div class="sub-task-editor">
    <div class="editor-head">
      <span class="editor-title">Шаги задачи</span>
      <button type="button" class="add-step-btn" @click="addStep">+ Добавить шаг</button>
    </div>

    <div v-if="local.length === 0" class="editor-empty">
      Шагов нет — разбейте задачу на шаги, чтобы отмечать прогресс.
    </div>

    <div v-for="(s, index) in local" :key="s.id ?? s._key" class="step-row">
      <input type="checkbox" v-model="s.isCompleted" class="step-check" title="Выполнен" />
      <input
        :value="s.name"
        type="text"
        class="step-name-input"
        :class="{ 'step-invalid': hasEmptyName }"
        maxlength="200"
        placeholder="Название шага"
        @input="onNameInput(s, $event)"
      />
      <button
        type="button"
        class="step-btn"
        :disabled="index === 0"
        @click="move(index, -1)"
        title="Выше"
      >↑</button>
      <button
        type="button"
        class="step-btn"
        :disabled="index === local.length - 1"
        @click="move(index, 1)"
        title="Ниже"
      >↓</button>
      <button
        type="button"
        class="step-btn step-del"
        @click="removeStep(index)"
        title="Удалить шаг"
      >🗑️</button>
    </div>

    <div v-if="hasEmptyName" class="editor-error">Заполните название каждого шага.</div>
  </div>
</template>

<script>
import { normalize } from '../utils/subtasks.js';

let keyCounter = 0;

function nextKey() {
  keyCounter += 1;
  return `new-${Date.now()}-${keyCounter}`;
}

export default {
  name: 'SubTasksEditor',

  props: {
    modelValue: {
      type: Array,
      default: () => []
    }
  },

  emits: ['update:modelValue'],

  data() {
    return {
      local: [],
      lastEmitted: null
    };
  },

  computed: {
    hasEmptyName() {
      return this.local.some(s => !s.name || !s.name.trim());
    }
  },

  watch: {
    modelValue(next) {
      if (next !== this.lastEmitted) {
        this.syncFrom(next);
      }
    }
  },

  created() {
    this.syncFrom(this.modelValue);
  },

  methods: {
    syncFrom(list) {
      this.local = normalize(list).map(s =>
        s.id == null ? Object.assign({}, s, { _key: nextKey() }) : s
      );
    },

    cleanCopy() {
      return this.local.map(s => ({
        id: s.id ?? null,
        name: s.name,
        position: s.position,
        isCompleted: !!s.isCompleted
      }));
    },

    emitChange() {
      const value = this.cleanCopy();
      this.lastEmitted = value;
      this.$emit('update:modelValue', value);
    },

    onNameInput(s, event) {
      s.name = event.target.value;
      this.emitChange();
    },

    addStep() {
      this.local.push({
        id: null,
        name: '',
        position: this.local.length + 1,
        isCompleted: false,
        _key: nextKey()
      });
      this.emitChange();
    },

    removeStep(index) {
      this.local.splice(index, 1);
      this.emitChange();
    },

    move(index, dir) {
      const target = index + dir;
      if (target < 0 || target >= this.local.length) {
        return;
      }
      const arr = this.local;
      const tmp = arr[target];
      arr[target] = arr[index];
      arr[index] = tmp;
      this.emitChange();
    }
  }
};
</script>

<style scoped>
.sub-task-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.editor-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.editor-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
}

.add-step-btn {
  padding: 6px 12px;
  background-color: var(--bg-tertiary);
  color: var(--accent-primary);
  border: 1px dashed var(--border-color);
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.2s ease, color 0.2s ease;
}

.add-step-btn:hover {
  border-color: var(--accent-primary);
}

.editor-empty {
  font-size: 12px;
  color: var(--text-muted);
  font-style: italic;
}

.step-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.step-check {
  flex-shrink: 0;
  cursor: pointer;
}

.step-name-input {
  flex: 1;
  min-width: 0;
  padding: 8px 10px;
  border: 1px solid var(--border-color);
  border-radius: 5px;
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  font-size: 14px;
  font-family: inherit;
}

.step-name-input:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.step-name-input.step-invalid {
  border-color: var(--accent-red);
}

.step-btn {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: 5px;
  background-color: var(--bg-tertiary);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;
}

.step-btn:hover:not(:disabled) {
  background-color: var(--border-color);
  color: var(--text-primary);
}

.step-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.step-del:hover:not(:disabled) {
  background-color: var(--accent-red-light);
  color: var(--accent-red);
}

.editor-error {
  font-size: 12px;
  color: var(--accent-red);
}
</style>