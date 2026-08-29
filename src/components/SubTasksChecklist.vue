<template>
  <div class="sub-task-checklist" :class="{ compact }">
    <label
      v-for="s in items"
      :key="s.id ?? s._key"
      class="sub-task-item"
      :class="{ 'is-done': s.isCompleted }"
    >
      <input
        type="checkbox"
        :checked="s.isCompleted"
        :disabled="s.id == null || isToggling(s)"
        @change="toggle(s, $event)"
      />
      <span class="sub-task-name">{{ s.name }}</span>
    </label>
    <div v-if="items.length === 0" class="sub-task-empty">Шагов нет</div>
  </div>
</template>

<script>
import { toggleSubTask } from '../api/tasks.js';

export default {
  name: 'SubTasksChecklist',

  props: {
    task: {
      type: Object,
      required: true
    },
    compact: {
      type: Boolean,
      default: false
    }
  },

  emits: ['updated'],

  data() {
    return {
      items: [],
      toggling: {}
    };
  },

  watch: {
    'task.subTasks'(list) {
      this.updateItems(list);
    }
  },

  created() {
    this.updateItems(this.task?.subTasks);
  },

  methods: {
    updateItems(list) {
      this.items = (list || []).map((s, i) =>
        s.id == null ? Object.assign({}, s, { _key: `new-${i}` }) : s
      );
    },

    isToggling(s) {
      return !!this.toggling[s.id];
    },

    startToggling(id) {
      this.toggling = { ...this.toggling, [id]: true };
    },

    finishToggling(id) {
      const next = { ...this.toggling };
      delete next[id];
      this.toggling = next;
    },

    async toggle(s, event) {
      if (s.id == null) {
        event.target.checked = !event.target.checked;
        return;
      }

      const next = event.target.checked;
      s.isCompleted = next;
      this.startToggling(s.id);

      try {
        const response = await toggleSubTask(this.task.id, s.id);

        this.finishToggling(s.id);

        if (response.isSuccess) {
          this.$emit('updated', response.data);
        } else {
          s.isCompleted = !next;
          alert('Не удалось изменить шаг: ' + (response.errorMessage || 'Неизвестная ошибка'));
        }
      } catch (err) {
        this.finishToggling(s.id);
        s.isCompleted = !next;
        alert('Ошибка при изменении шага');
        console.error('Ошибка переключения шага:', err);
      }
    }
  }
};
</script>

<style scoped>
.sub-task-checklist {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sub-task-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 6px;
  transition: background-color 0.15s ease;
}

.sub-task-item:hover {
  background-color: var(--bg-tertiary);
}

.sub-task-item input[type='checkbox'] {
  margin-top: 3px;
  flex-shrink: 0;
  cursor: pointer;
}

.sub-task-item input[type='checkbox']:disabled {
  cursor: not-allowed;
}

.sub-task-name {
  font-size: 13px;
  color: var(--text-primary);
  line-height: 1.4;
  word-break: break-word;
  flex: 1;
}

.sub-task-item.is-done .sub-task-name {
  text-decoration: line-through;
  color: var(--text-muted);
}

.sub-task-empty {
  font-size: 12px;
  color: var(--text-muted);
  font-style: italic;
  padding: 4px 6px;
}

.compact .sub-task-name {
  font-size: 12px;
}

.compact .sub-task-item {
  padding: 2px 4px;
}
</style>