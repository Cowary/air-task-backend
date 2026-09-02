import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';

vi.mock('../../api/tasks.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getTasks: vi.fn(),
    toggleTask: vi.fn(),
    createTask: vi.fn(),
    getAllProjects: vi.fn()
  };
});

import { getTasks, toggleTask, createTask, getAllProjects } from '../../api/tasks.js';
import TasksPage from '../TasksPage.vue';

function task(id, isComplete) {
  return {
    id,
    name: `Задача ${id}`,
    priority: 'LOW',
    isComplete,
    project: { name: 'Проект' },
    description: '',
    createdTs: '2026-09-01T10:00:00',
    subTasks: []
  };
}

async function mountPage() {
  const wrapper = mount(TasksPage, {
    global: {
      stubs: {
        RouterLink: { template: '<a><slot /></a>' },
        ProjectModal: true,
        SubTasksChecklist: true,
        SubTasksEditor: true
      }
    }
  });
  await flushPromises();
  return wrapper;
}

describe('TasksPage — невыполненные/выполненные вместо статусов', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getTasks.mockResolvedValue({
      isSuccess: true,
      data: [task(1, false), task(2, true), task(3, false)]
    });
    vi.stubGlobal('alert', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('фильтр выполнения по умолчанию — «Невыполненные»', async () => {
    const wrapper = await mountPage();

    expect(wrapper.find('#filterCompletion').element.value).toBe('incomplete');
    expect(wrapper.findAll('.task-card')).toHaveLength(2);
  });

  it('значение «Все» показывает и выполненные задачи', async () => {
    const wrapper = await mountPage();

    await wrapper.find('#filterCompletion').setValue('');

    expect(wrapper.findAll('.task-card')).toHaveLength(3);
  });

  it('значение «Выполненные» показывает только isComplete: true', async () => {
    const wrapper = await mountPage();

    await wrapper.find('#filterCompletion').setValue('completed');
    await flushPromises();

    expect(wrapper.findAll('.task-card')).toHaveLength(1);
    expect(wrapper.find('.task-name').text()).toBe('Задача 2');
  });

  it('чекбокс задачи дёргает toggle и применяет серверный ответ', async () => {
    const wrapper = await mountPage();
    toggleTask.mockResolvedValue({ isSuccess: true, data: task(1, true) });

    await wrapper.find('input.task-checkbox').setValue(true);
    await flushPromises();

    expect(toggleTask).toHaveBeenCalledWith(1);
    const first = wrapper.vm.tasks.find(t => t.id === 1);
    expect(first.isComplete).toBe(true);
  });

  it('при ошибке toggle откатывает флаг и показывает alert', async () => {
    const wrapper = await mountPage();
    toggleTask.mockResolvedValue({ isSuccess: false, errorMessage: 'нет' });

    await wrapper.find('input.task-checkbox').setValue(true);
    await flushPromises();

    const first = wrapper.vm.tasks.find(t => t.id === 1);
    expect(first.isComplete).toBe(false);
    expect(globalThis.alert).toHaveBeenCalled();
  });

  it('на странице больше нет селекта статуса (фильтр и форма)', async () => {
    const wrapper = await mountPage();

    expect(wrapper.find('#filterStatus').exists()).toBe(false);

    await wrapper.vm.openCreateModal();
    await wrapper.vm.$nextTick();

    expect(wrapper.find('#taskStatus').exists()).toBe(false);
  });

  it('форма создания отправляет задачу без поля status', async () => {
    getTasks.mockResolvedValue({ isSuccess: true, data: [] });
    getAllProjects.mockResolvedValue({ isSuccess: true, data: { projects: [{ id: 1, name: 'Проект' }] } });
    createTask.mockResolvedValue({ isSuccess: true, data: task(9, false) });

    const wrapper = await mountPage();
    await wrapper.vm.openCreateModal();
    wrapper.vm.taskForm.name = 'Новая';
    wrapper.vm.taskForm.projectName = 'Проект';

    await wrapper.vm.saveTask();
    await flushPromises();

    const body = createTask.mock.calls[0][0];
    expect(body).not.toHaveProperty('status');
    expect(body).toMatchObject({ name: 'Новая', projectName: 'Проект' });
  });
});
