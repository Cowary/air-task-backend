import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';

vi.mock('../../../api/weeklyTasks.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getAllWeeklyTasks: vi.fn(),
    deleteWeeklyTask: vi.fn(),
    completeWeeklyTask: vi.fn()
  };
});

import WeekPanel from '../WeekPanel.vue';
import WeeklyTaskFormModal from '../WeeklyTaskFormModal.vue';
import { getAllWeeklyTasks, deleteWeeklyTask } from '../../../api/weeklyTasks.js';

const weekly = {
  id: 5,
  name: 'Зарядка',
  count: 2,
  priority: 'HIGH',
  status: 'IN_PROGRESS',
  project: { id: 1, name: 'Здоровье' }
};

const statistics = {
  weekNumber: 40,
  totalWeeklyTask: 2,
  incompletedWeekly: 1,
  completedWeekly: 1,
  incompleteTasks: [
    {
      weeklyTaskId: 5,
      weeklyTaskName: 'Зарядка',
      completedCount: 0,
      requiredCount: 2,
      completionPercentage: '0.0%',
      projectName: 'Здоровье',
      completedToday: false
    }
  ],
  completedTasks: [
    {
      weeklyTaskId: 6,
      weeklyTaskName: 'Бег',
      completedCount: 3,
      requiredCount: 3,
      completionPercentage: '100%',
      projectName: 'Здоровье',
      completedToday: true
    }
  ]
};

function mountPanel() {
  return mount(WeekPanel, {
    props: {
      statistics,
      projects: [{ id: 1, name: 'Здоровье' }]
    },
    global: {
      stubs: {
        WeeklyTaskFormModal: true
      }
    }
  });
}

describe('WeekPanel — создание/редактирование/удаление недельных задач', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('alert', vi.fn());
    getAllWeeklyTasks.mockResolvedValue({ isSuccess: true, data: [weekly] });
    deleteWeeklyTask.mockResolvedValue({ isSuccess: true, data: null });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('показывает кнопку создания и открывает модальное окно с проектами', async () => {
    const wrapper = mountPanel();
    await flushPromises();

    const button = wrapper.find('.section-add-btn');
    expect(button.text()).toContain('Еженедельная задача');

    await button.trigger('click');

    const modal = wrapper.findComponent(WeeklyTaskFormModal);
    expect(modal.props('visible')).toBe(true);
    expect(modal.props('task')).toBeNull();
    expect(modal.props('projects')).toEqual([{ id: 1, name: 'Здоровье' }]);
  });

  it('открывает редактирование с полным объектом задачи', async () => {
    const wrapper = mountPanel();
    await flushPromises();

    await wrapper.find('.edit-btn').trigger('click');

    const modal = wrapper.findComponent(WeeklyTaskFormModal);
    expect(modal.props('visible')).toBe(true);
    expect(modal.props('task')).toMatchObject({ id: 5, name: 'Зарядка', priority: 'HIGH' });
  });

  it('после сохранения эмитит changed и перезагружает список', async () => {
    const wrapper = mountPanel();
    await flushPromises();
    getAllWeeklyTasks.mockClear();

    wrapper.findComponent(WeeklyTaskFormModal).vm.$emit('saved', weekly);
    await flushPromises();

    expect(wrapper.emitted('changed')).toHaveLength(1);
    expect(getAllWeeklyTasks).toHaveBeenCalled();
  });

  it('подтверждение удаления вызывает API и эмитит changed', async () => {
    const wrapper = mountPanel();
    await flushPromises();

    await wrapper.find('.delete-btn').trigger('click');
    expect(wrapper.vm.showDeleteModal).toBe(true);

    await wrapper.vm.removeWeekly();
    await flushPromises();

    expect(deleteWeeklyTask).toHaveBeenCalledWith(5);
    expect(wrapper.emitted('changed')).toHaveLength(1);
    expect(wrapper.vm.showDeleteModal).toBe(false);
  });

  it('не показывает действия, если задача отсутствует в полном списке', async () => {
    getAllWeeklyTasks.mockResolvedValue({ isSuccess: true, data: [] });
    const wrapper = mountPanel();
    await flushPromises();

    expect(wrapper.find('.edit-btn').exists()).toBe(false);
    expect(wrapper.find('.delete-btn').exists()).toBe(false);
  });
});
