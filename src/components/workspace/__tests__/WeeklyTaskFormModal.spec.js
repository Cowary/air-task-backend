import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';

vi.mock('../../../api/weeklyTasks.js', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, createWeeklyTask: vi.fn(), updateWeeklyTask: vi.fn() };
});

import { createWeeklyTask, updateWeeklyTask } from '../../../api/weeklyTasks.js';
import WeeklyTaskFormModal from '../WeeklyTaskFormModal.vue';

const projects = [
  { id: 1, name: 'Alpha' },
  { id: 2, name: 'Beta' }
];

async function mountModal(props = {}) {
  const wrapper = mount(WeeklyTaskFormModal, {
    props: { visible: false, projects, task: null, ...props },
    global: { stubs: { Teleport: true } }
  });
  await wrapper.setProps({ visible: true });
  await flushPromises();
  return wrapper;
}

describe('WeeklyTaskFormModal — проект при редактировании', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('alert', vi.fn());
    createWeeklyTask.mockResolvedValue({ isSuccess: true, data: {} });
    updateWeeklyTask.mockResolvedValue({ isSuccess: true, data: {} });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('показывает проект задачи, когда у weekly из списка проекта нет поля project', async () => {
    const wrapper = await mountModal({
      task: { id: 5, name: 'Недельная', count: 1, priority: 'LOW', status: 'IN_PROGRESS' },
      defaultProjectName: 'Alpha'
    });

    expect(wrapper.find('#wsWeeklyProject').element.value).toBe('Alpha');
  });

  it('показывает проект задачи, когда project пришёл полным объектом', async () => {
    const wrapper = await mountModal({
      task: { id: 6, name: 'Недельная', count: 1, priority: 'LOW', status: 'IN_PROGRESS', project: { name: 'Beta' } }
    });

    expect(wrapper.find('#wsWeeklyProject').element.value).toBe('Beta');
  });

  it('оставляет «Без проекта», если у задачи нет ни проекта, ни defaultProjectName', async () => {
    const wrapper = await mountModal({
      task: { id: 7, name: 'Недельная', count: 1, priority: 'LOW', status: 'IN_PROGRESS' }
    });

    expect(wrapper.find('#wsWeeklyProject').element.value).toBe('');
  });
});
