import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';

vi.mock('../../../api/tasks.js', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, createTask: vi.fn(), updateTask: vi.fn() };
});

import { createTask, updateTask } from '../../../api/tasks.js';
import TaskFormModal from '../TaskFormModal.vue';

const projects = [
  { id: 1, name: 'Alpha', dueDate: '2026-10-10' },
  { id: 2, name: 'Beta', dueDate: null }
];

async function mountModal(props = {}) {
  const wrapper = mount(TaskFormModal, {
    props: { visible: false, projects, task: null, ...props },
    global: { stubs: { SubTasksEditor: true, Teleport: true } }
  });
  await wrapper.setProps({ visible: true });
  await flushPromises();
  return wrapper;
}

async function fillForm(wrapper, { name = 'Задача', project = 'Alpha', date }) {
  await wrapper.find('#wsTaskName').setValue(name);
  await wrapper.find('#wsTaskProject').setValue(project);
  if (date) {
    await wrapper.find('#wsTaskDueDate').setValue(date);
  }
}

describe('TaskFormModal — ограничение даты датой проекта', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('alert', vi.fn());
    createTask.mockResolvedValue({ isSuccess: true, data: {} });
    updateTask.mockResolvedValue({ isSuccess: true, data: {} });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('показывает ограничение max и подсказку для выбранного проекта', async () => {
    const wrapper = await mountModal();
    await wrapper.find('#wsTaskProject').setValue('Alpha');

    expect(wrapper.find('.date-field-native').attributes('max')).toBe('2026-10-10');
    expect(wrapper.text()).toContain('Не позже даты окончания проекта: 10.10.2026');
  });

  it('блокирует сохранение даты позже даты проекта', async () => {
    const wrapper = await mountModal();
    await fillForm(wrapper, { date: '11.10.2026' });

    await wrapper.find('form').trigger('submit.prevent');

    expect(createTask).not.toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith(
      'Дата задачи не может быть позже даты окончания проекта: 10.10.2026'
    );
  });

  it('разрешает сохранить дату в пределах даты проекта', async () => {
    const wrapper = await mountModal();
    await fillForm(wrapper, { date: '09.10.2026' });

    await wrapper.find('form').trigger('submit.prevent');

    expect(createTask).toHaveBeenCalledTimes(1);
    expect(createTask.mock.calls[0][0].dueDate).toBe('2026-10-09');
  });

  it('не ограничивает дату, если у проекта нет даты окончания', async () => {
    const wrapper = await mountModal();
    await fillForm(wrapper, { project: 'Beta', date: '31.12.2030' });

    await wrapper.find('form').trigger('submit.prevent');

    expect(createTask).toHaveBeenCalledTimes(1);
    expect(createTask.mock.calls[0][0].dueDate).toBe('2030-12-31');
  });
});

describe('TaskFormModal — задача без проекта', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('alert', vi.fn());
    createTask.mockResolvedValue({ isSuccess: true, data: {} });
    updateTask.mockResolvedValue({ isSuccess: true, data: {} });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('позволяет сохранить задачу без проекта', async () => {
    const wrapper = await mountModal();
    await wrapper.find('#wsTaskName').setValue('Задача');

    await wrapper.find('form').trigger('submit.prevent');

    expect(createTask).toHaveBeenCalledTimes(1);
    expect(createTask.mock.calls[0][0].projectName).toBe('');
  });

  it('при редактировании задачи без проекта оставляет поле пустым', async () => {
    const wrapper = await mountModal({
      task: { id: 5, name: 'Без проекта задача', priority: 'LOW', project: null, subTasks: [] }
    });

    expect(wrapper.find('#wsTaskProject').element.value).toBe('');
  });
});

describe('TaskFormModal — смена статуса при редактировании', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('alert', vi.fn());
    updateTask.mockResolvedValue({ isSuccess: true, data: {} });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const existingTask = {
    id: 7,
    name: 'Задача',
    priority: 'LOW',
    project: null,
    isComplete: false,
    subTasks: []
  };

  it('показывает чекбокс статуса только при редактировании', async () => {
    const createWrapper = await mountModal();
    expect(createWrapper.find('#wsTaskComplete').exists()).toBe(false);

    const editWrapper = await mountModal({ task: existingTask });
    expect(editWrapper.find('#wsTaskComplete').exists()).toBe(true);
  });

  it('отправляет изменённый статус в updateTask', async () => {
    const wrapper = await mountModal({ task: existingTask });

    await wrapper.find('#wsTaskComplete').setValue(true);
    await wrapper.find('form').trigger('submit.prevent');

    expect(updateTask).toHaveBeenCalledTimes(1);
    expect(updateTask.mock.calls[0][0].isComplete).toBe(true);
  });
});
