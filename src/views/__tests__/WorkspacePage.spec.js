import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';

vi.mock('../../api/projects.js', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, getAllProjects: vi.fn() };
});

vi.mock('../../api/tasks.js', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, getTasks: vi.fn() };
});

vi.mock('../../api/weeklyTasks.js', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, getWeeklyTaskStatistics: vi.fn() };
});

import { getAllProjects } from '../../api/projects.js';
import { getTasks } from '../../api/tasks.js';
import { getWeeklyTaskStatistics } from '../../api/weeklyTasks.js';
import WorkspacePage from '../WorkspacePage.vue';
import ProjectsPanel from '../../components/workspace/ProjectsPanel.vue';

function mockResponses() {
  getAllProjects.mockResolvedValue({ isSuccess: true, data: { projects: [{ id: 1, name: 'A', status: 'ACTIVE' }] } });
  getTasks.mockResolvedValue({ isSuccess: true, data: [] });
  getWeeklyTaskStatistics.mockResolvedValue({ isSuccess: true, data: { completedTasks: [], incompleteTasks: [] } });
}

async function mountPage() {
  const wrapper = mount(WorkspacePage, {
    global: {
      stubs: {
        RouterLink: { template: '<a><slot /></a>' },
        ProjectsPanel: true,
        WeekPanel: true,
        TaskListSection: true
      }
    }
  });
  await flushPromises();
  return wrapper;
}

describe('WorkspacePage — сортировка и фильтр статусов проектов', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResponses();
  });

  it('при загрузке запрашивает только активные проекты, отсортированные по приоритету', async () => {
    await mountPage();

    expect(getAllProjects).toHaveBeenCalledWith({
      statuses: ['ACTIVE', 'IN_PROGRESS'],
      sortByPriority: true
    });
  });

  it('при смене статуса перезапрашивает только проекты и не трогает статистику недели', async () => {
    const wrapper = await mountPage();
    getAllProjects.mockResolvedValue({
      isSuccess: true,
      data: { projects: [{ id: 7, name: 'Завершённый', status: 'DONE' }] }
    });

    wrapper.findComponent(ProjectsPanel).vm.$emit('statuses-changed', ['DONE']);
    await flushPromises();

    expect(getAllProjects).toHaveBeenCalledTimes(2);
    expect(getAllProjects).toHaveBeenLastCalledWith({ statuses: ['DONE'], sortByPriority: true });
    expect(getWeeklyTaskStatistics).toHaveBeenCalledTimes(1);
    expect(wrapper.vm.projects).toEqual([{ id: 7, name: 'Завершённый', status: 'DONE' }]);
  });
});
