import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';

vi.mock('../../../api/tasks.js', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, toggleTask: vi.fn(), deleteTask: vi.fn() };
});

import { toggleTask } from '../../../api/tasks.js';
import TaskListSection from '../TaskListSection.vue';

function task(id, isComplete, extra = {}) {
  return {
    id,
    name: `Задача ${id}`,
    priority: 'LOW',
    isComplete,
    project: { name: 'Проект А' },
    description: '',
    createdTs: '2026-09-01T10:00:00',
    subTasks: [],
    ...extra
  };
}

function mountSection(tasks, props = {}) {
  return mount(TaskListSection, {
    props: { tasks, ...props },
    global: {
      stubs: { TaskFormModal: true, SubTasksChecklist: true }
    }
  });
}

describe('TaskListSection — чекбокс выполнения задачи', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('alert', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('чекбокс отражает isComplete задачи', () => {
    const wrapper = mountSection([task(1, false), task(2, true)]);
    const checkboxes = wrapper.findAll('input.task-checkbox');

    expect(checkboxes).toHaveLength(2);
    expect(checkboxes[0].element.checked).toBe(false);
    expect(checkboxes[1].element.checked).toBe(true);
  });

  it('выполненная задача получает зачёркнутый заголовок', () => {
    const wrapper = mountSection([task(2, true)]);
    const card = wrapper.find('.task-card');

    expect(card.classes()).toContain('task-completed');
  });

  it('при клике оптимистично флапает флаг и дёргает POST toggle', async () => {
    toggleTask.mockResolvedValue({ isSuccess: true, data: task(1, true) });
    const wrapper = mountSection([task(1, false)]);

    await wrapper.find('input.task-checkbox').setValue(true);

    expect(toggleTask).toHaveBeenCalledWith(1);
    expect(wrapper.find('input.task-checkbox').element.checked).toBe(true);
  });

  it('после успешного ответа эмитит changed и берёт серверное значение', async () => {
    toggleTask.mockResolvedValue({ isSuccess: true, data: task(1, true) });
    const wrapper = mountSection([task(1, false)]);

    await wrapper.find('input.task-checkbox').setValue(true);
    await flushPromises();

    expect(wrapper.emitted('changed')).toHaveLength(1);
    expect(wrapper.find('input.task-checkbox').element.checked).toBe(true);
  });

  it('при isSuccess: false откатывает чекбокс и показывает alert', async () => {
    toggleTask.mockResolvedValue({ isSuccess: false, errorMessage: 'нет' });
    const wrapper = mountSection([task(1, false)]);

    await wrapper.find('input.task-checkbox').setValue(true);
    await flushPromises();

    expect(wrapper.find('input.task-checkbox').element.checked).toBe(false);
    expect(globalThis.alert).toHaveBeenCalled();
    expect(wrapper.emitted('changed')).toBeUndefined();
  });

  it('при сетевой ошибке откатывает чекбокс', async () => {
    toggleTask.mockRejectedValue(new Error('network'));
    const wrapper = mountSection([task(1, true)]);

    await wrapper.find('input.task-checkbox').setValue(false);
    await flushPromises();

    expect(wrapper.find('input.task-checkbox').element.checked).toBe(true);
    expect(globalThis.alert).toHaveBeenCalled();
  });

  it('на время запроса чекбокс заблокирован', async () => {
    let resolveToggle;
    toggleTask.mockImplementation(() => new Promise(resolve => {
      resolveToggle = resolve;
    }));
    const wrapper = mountSection([task(1, false)]);

    await wrapper.find('input.task-checkbox').setValue(true);

    expect(wrapper.find('input.task-checkbox').attributes('disabled')).toBeDefined();

    resolveToggle({ isSuccess: true, data: task(1, true) });
    await flushPromises();

    expect(wrapper.find('input.task-checkbox').attributes('disabled')).toBeUndefined();
  });

  it('снятие отметки с выполненной задачи тоже дёргает toggle', async () => {
    toggleTask.mockResolvedValue({ isSuccess: true, data: task(1, false) });
    const wrapper = mountSection([task(1, true)]);

    await wrapper.find('input.task-checkbox').setValue(false);
    await flushPromises();

    expect(toggleTask).toHaveBeenCalledWith(1);
    expect(wrapper.emitted('changed')).toHaveLength(1);
  });
});

describe('TaskListSection — удаление статусов из UI', () => {
  it('нет селекта фильтра статусов и опций статусов в тулбаре', () => {
    const wrapper = mountSection([task(1, false)], { showFilters: true });
    const html = wrapper.find('.section-toolbar').html();

    expect(html).not.toContain('IDEA');
    expect(html).not.toContain('BACKLOG');
    expect(html).not.toContain('CANCELED');
    expect(wrapper.find('.task-status').exists()).toBe(false);
  });

  it('нет переключателя Список/Канбан и самой канбан-доски', () => {
    const wrapper = mountSection([task(1, false)]);
    const html = wrapper.html();

    expect(html).not.toContain('Канбан');
    expect(wrapper.findComponent({ name: 'KanbanBoard' }).exists()).toBe(false);
  });

  it('фильтр по приоритету сохранён', () => {
    const wrapper = mountSection([task(1, false)], { showFilters: true });

    expect(wrapper.find('select[title="Приоритет"]').exists()).toBe(true);
  });
});
