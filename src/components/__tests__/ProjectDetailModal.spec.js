import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';

vi.mock('../../api/projects.js', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, getProjectById: vi.fn() };
});

vi.mock('../../api/goals.js', () => ({
  updateGoalStatus: vi.fn()
}));

vi.mock('../../api/tasks.js', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, toggleTask: vi.fn() };
});

import { getProjectById } from '../../api/projects.js';
import { toggleTask } from '../../api/tasks.js';
import ProjectDetailModal from '../ProjectDetailModal.vue';

function projectResponse() {
  return {
    isSuccess: true,
    data: {
      id: 1,
      name: 'Проект',
      status: 'ACTIVE',
      priority: 'LOW',
      goalList: [],
      weeklyList: [],
      taskList: [
        { id: 10, name: 'Невыполненная', priority: 'LOW', isComplete: false, subTasks: [] },
        { id: 11, name: 'Выполненная', priority: 'LOW', isComplete: true, subTasks: [] }
      ]
    }
  };
}

async function mountModal() {
  getProjectById.mockResolvedValue(projectResponse());
  const wrapper = mount(ProjectDetailModal, {
    props: { visible: false, projectId: 1 },
    global: {
      stubs: { SubTasksChecklist: true }
    }
  });

  await wrapper.setProps({ visible: true });
  await flushPromises();
  return wrapper;
}

describe('ProjectDetailModal — чекбокс выполнения задачи', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('alert', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('в таблице задач нет колонки статуса, вместо неё — чекбоксы', async () => {
    const wrapper = await mountModal();
    const headers = wrapper.findAll('th').map(th => th.text());

    expect(headers).not.toContain('Статус');
    expect(headers).toContain('Выполнение');
    const checkboxes = wrapper.findAll('input.task-complete-checkbox');
    expect(checkboxes.map(cb => cb.element.checked)).toEqual([false, true]);
  });

  it('при клике дёргает POST /v1/task/{id}/toggle', async () => {
    const wrapper = await mountModal();
    toggleTask.mockResolvedValue({
      isSuccess: true,
      data: { id: 10, name: 'Невыполненная', priority: 'LOW', isComplete: true, subTasks: [] }
    });

    await wrapper.findAll('input.task-complete-checkbox')[0].setValue(true);
    await flushPromises();

    expect(toggleTask).toHaveBeenCalledWith(10);
  });

  it('после успешного ответа берёт данные задачи с сервера', async () => {
    const wrapper = await mountModal();
    toggleTask.mockResolvedValue({
      isSuccess: true,
      data: { id: 10, name: 'Невыполненная', priority: 'LOW', isComplete: true, subTasks: [] }
    });

    await wrapper.findAll('input.task-complete-checkbox')[0].setValue(true);
    await flushPromises();

    expect(wrapper.vm.project.taskList[0].isComplete).toBe(true);
  });

  it('при ошибке откатывает чекбокс и показывает alert', async () => {
    const wrapper = await mountModal();
    toggleTask.mockResolvedValue({ isSuccess: false, errorMessage: 'ошибка' });

    await wrapper.findAll('input.task-complete-checkbox')[0].setValue(true);
    await flushPromises();

    expect(wrapper.findAll('input.task-complete-checkbox')[0].element.checked).toBe(false);
    expect(globalThis.alert).toHaveBeenCalled();
  });

  it('при сетевой ошибке откатывает чекбокс', async () => {
    const wrapper = await mountModal();
    toggleTask.mockRejectedValue(new Error('network'));

    await wrapper.findAll('input.task-complete-checkbox')[1].setValue(false);
    await flushPromises();

    expect(wrapper.findAll('input.task-complete-checkbox')[1].element.checked).toBe(true);
    expect(globalThis.alert).toHaveBeenCalled();
  });

  it('на время запроса чекбокс заблокирован, потом разблокирован', async () => {
    const wrapper = await mountModal();
    let resolveToggle;
    toggleTask.mockImplementation(() => new Promise(resolve => {
      resolveToggle = resolve;
    }));

    await wrapper.findAll('input.task-complete-checkbox')[0].setValue(true);

    expect(wrapper.findAll('input.task-complete-checkbox')[0].attributes('disabled')).toBeDefined();

    resolveToggle({ isSuccess: true, data: { id: 10, isComplete: true } });
    await flushPromises();

    expect(wrapper.findAll('input.task-complete-checkbox')[0].attributes('disabled')).toBeUndefined();
  });
});
