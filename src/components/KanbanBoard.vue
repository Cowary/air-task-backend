<template>
  <div class="kanban-wrapper">
    <div class="toolbar">
      <div class="filter-group">
        <label for="kanbanFilterProject">Проект:</label>
        <select id="kanbanFilterProject" v-model="filterProject">
          <option value="">Все проекты</option>
          <option v-for="project in uniqueProjects" :key="project" :value="project">
            {{ project }}
          </option>
        </select>

        <label for="kanbanFilterStatus">Статус:</label>
        <select id="kanbanFilterStatus" v-model="filterStatus">
          <option value="">Все статусы</option>
          <option value="IDEA">Идея</option>
          <option value="BACKLOG">Бэклог</option>
          <option value="IN_PROGRESS">В работе</option>
          <option value="DONE">Выполнено</option>
          <option value="PAUSED">На паузе</option>
          <option value="CANCELED">Отменено</option>
        </select>

        <label for="kanbanFilterPriority">Приоритет:</label>
        <select id="kanbanFilterPriority" v-model="filterPriority">
          <option value="">Все приоритеты</option>
          <option value="HIGH">Высокий</option>
          <option value="MIDDLE">Средний</option>
          <option value="LOW">Низкий</option>
        </select>
      </div>

      <button @click="$emit('create-task')" class="create-btn">+ Создать задачу</button>
    </div>

    <div class="kanban-board">
      <div
        v-for="col in columns"
        :key="col.status"
        class="kanban-column"
        :class="`column-${col.status.toLowerCase()}`"
      >
        <div class="column-header">
          <span class="column-status-badge" :class="`status-${col.status.toLowerCase()}`">
            {{ col.label }}
          </span>
          <span class="column-count">{{ col.tasks.length }}</span>
        </div>

        <draggable
          :list="col.tasks"
          group="tasks"
          item-key="id"
          :empty-insert-threshold="50"
          class="column-body"
          @change="onDragChange($event, col.status)"
        >
          <template #item="{ element: task }">
            <div class="kanban-card">
              <div class="card-header">
                <span class="card-project" v-if="task.project?.name">
                  {{ task.project.name }}
                </span>
                <span
                  class="card-priority"
                  :class="`priority-${task.priority?.toLowerCase()}`"
                >
                  {{ getPriorityLabel(task.priority) }}
                </span>
              </div>
              <div class="card-title">{{ task.name }}</div>
              <div class="card-footer">
                <button
                  class="card-edit-btn"
                  title="Редактировать"
                  @click="$emit('edit-task', task)"
                >
                  ✏️
                </button>
              </div>
            </div>
          </template>

          <template #empty>
            <div class="column-empty">
              <span>Нет задач</span>
            </div>
          </template>
        </draggable>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import draggable from 'vuedraggable'

const props = defineProps({
  tasks: { type: Array, required: true }
})

const emit = defineEmits(['update-status', 'edit-task', 'create-task'])

const filterProject = ref('')
const filterStatus = ref('')
const filterPriority = ref('')

const uniqueProjects = computed(() => {
  const projects = new Set()
  props.tasks.forEach(task => {
    if (task.project?.name) {
      projects.add(task.project.name)
    }
  })
  return Array.from(projects).sort()
})

const filteredTasks = computed(() => {
  return props.tasks.filter(task => {
    if (filterProject.value && task.project?.name !== filterProject.value) return false
    if (filterStatus.value && task.status !== filterStatus.value) return false
    if (filterPriority.value && task.priority !== filterPriority.value) return false
    return true
  })
})

const columnDefs = [
  { status: 'IDEA', label: 'Идея' },
  { status: 'BACKLOG', label: 'Бэклог' },
  { status: 'IN_PROGRESS', label: 'В работе' },
  { status: 'DONE', label: 'Выполнено' },
  { status: 'PAUSED', label: 'На паузе' },
  { status: 'CANCELED', label: 'Отменено' }
]

const columns = computed(() => {
  return columnDefs.map(col => ({
    ...col,
    tasks: filteredTasks.value.filter(t => t.status === col.status)
  }))
})

function getPriorityLabel(priority) {
  const labels = { HIGH: 'Высокий', MIDDLE: 'Средний', LOW: 'Низкий' }
  return labels[priority] || priority
}

function onDragChange(evt, targetStatus) {
  const added = evt.added
  if (!added) return
  const taskId = added.element.id
  emit('update-status', { taskId, newStatus: targetStatus })
}
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 10px 14px;
  background-color: var(--bg-secondary);
  border-radius: 8px;
  flex-wrap: wrap;
  gap: 10px;
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
  flex-shrink: 0;
}

.create-btn:hover {
  background-color: #5a6fd6;
}

.kanban-board {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.kanban-column {
  flex: 1;
  min-width: 200px;
  background-color: var(--bg-secondary);
  border-radius: 12px;
  border: 2px solid var(--border-color);
  display: flex;
  flex-direction: column;
  min-height: calc(90vh - 240px);
  max-height: calc(90vh - 240px);
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 2px solid var(--border-color);
  flex-shrink: 0;
}

.column-status-badge {
  font-size: 13px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 20px;
}

.column-count {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-muted);
  background-color: var(--bg-tertiary);
  min-width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}

.column-body {
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  min-height: 80px;
}

.kanban-card {
  background-color: var(--bg-tertiary);
  border-radius: 8px;
  padding: 12px;
  border: 1px solid var(--border-color);
  cursor: grab;
  transition: box-shadow 0.2s, transform 0.15s;
}

.kanban-card:hover {
  box-shadow: 0 3px 10px var(--shadow-color);
  transform: translateY(-1px);
}

.kanban-card:active {
  cursor: grabbing;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  gap: 8px;
}

.card-project {
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-priority {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
  flex-shrink: 0;
}

.card-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  line-height: 1.4;
  word-break: break-word;
}

.card-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.card-edit-btn {
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.card-edit-btn:hover {
  background-color: var(--accent-blue-light);
}

.column-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30px 10px;
  color: var(--text-muted);
  font-size: 13px;
  font-style: italic;
}

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

.status-idea {
  background-color: var(--accent-purple-light);
  color: var(--accent-purple);
}

.status-backlog {
  background-color: var(--accent-gray-light);
  color: var(--accent-gray);
}

.status-in_progress {
  background-color: var(--accent-blue-light);
  color: var(--accent-blue);
}

.status-done {
  background-color: var(--accent-green-light);
  color: var(--accent-green);
}

.status-paused {
  background-color: var(--accent-orange-light);
  color: var(--accent-orange);
}

.status-canceled {
  background-color: var(--accent-red-light);
  color: var(--accent-red);
}

.column-idea .column-header { border-bottom-color: var(--accent-purple); }
.column-backlog .column-header { border-bottom-color: var(--accent-gray); }
.column-in_progress .column-header { border-bottom-color: var(--accent-blue); }
.column-done .column-header { border-bottom-color: var(--accent-green); }
.column-paused .column-header { border-bottom-color: var(--accent-orange); }
.column-canceled .column-header { border-bottom-color: var(--accent-red); }
</style>
