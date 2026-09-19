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

vi.mock('../../api/ideas.js', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, getAllIdeas: vi.fn() };
});

import { getAllProjects } from '../../api/projects.js';
import { getTasks } from '../../api/tasks.js';
import { getWeeklyTaskStatistics } from '../../api/weeklyTasks.js';
import { getAllIdeas } from '../../api/ideas.js';
import WorkspacePage from '../WorkspacePage.vue';
import ProjectsPanel from '../../components/workspace/ProjectsPanel.vue';
import IdeasPanel from '../../components/workspace/IdeasPanel.vue';
import RemindersPanel from '../../components/workspace/RemindersPanel.vue';
import CalendarPanel from '../../components/workspace/CalendarPanel.vue';
import TaskListSection, { NO_PROJECT_FILTER } from '../../components/workspace/TaskListSection.vue';

function mockResponses() {
  getAllProjects.mockResolvedValue({ isSuccess: true, data: { projects: [{ id: 1, name: 'A', status: 'ACTIVE' }] } });
  getTasks.mockResolvedValue({ isSuccess: true, data: [] });
  getWeeklyTaskStatistics.mockResolvedValue({ isSuccess: true, data: { completedTasks: [], incompleteTasks: [] } });
  getAllIdeas.mockResolvedValue({ isSuccess: true, data: [] });
}

async function mountPage() {
  const wrapper = mount(WorkspacePage, {
    global: {
      stubs: {
        RouterLink: { template: '<a><slot /></a>' },
        ProjectsPanel: true,
        WeekPanel: true,
        IdeasPanel: true,
        RemindersPanel: true,
        CalendarPanel: true,
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

function task(id, isComplete) {
  return { id, name: `Задача ${id}`, priority: 'LOW', isComplete, project: { name: 'A' } };
}

describe('WorkspacePage — вкладки задач и фильтр выполнения', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAllProjects.mockResolvedValue({ isSuccess: true, data: { projects: [] } });
    getTasks.mockResolvedValue({
      isSuccess: true,
      data: [task(1, false), task(2, true), task(3, false)]
    });
    getWeeklyTaskStatistics.mockResolvedValue({ isSuccess: true, data: { completedTasks: [], incompleteTasks: [] } });
    getAllIdeas.mockResolvedValue({ isSuccess: true, data: [] });
  });

  it('на вкладке «Все задачи» по умолчанию показаны только невыполненные', async () => {
    const wrapper = await mountPage();

    wrapper.findAll('.tab-btn')[2].trigger('click');
    await wrapper.vm.$nextTick();

    const section = wrapper.findComponent(TaskListSection);
    expect(section.props('tasks').map(t => t.id)).toEqual([1, 3]);
  });

  it('переключатель «Выполненные» оставляет только isComplete: true', async () => {
    const wrapper = await mountPage();

    wrapper.findAll('.tab-btn')[2].trigger('click');
    await wrapper.vm.$nextTick();
    wrapper.findAll('.completion-btn')[1].trigger('click');
    await wrapper.vm.$nextTick();

    const section = wrapper.findComponent(TaskListSection);
    expect(section.props('tasks').map(t => t.id)).toEqual([2]);
  });

  it('переключатель «Все» не фильтрует по выполнению', async () => {
    const wrapper = await mountPage();

    wrapper.findAll('.tab-btn')[2].trigger('click');
    await wrapper.vm.$nextTick();
    wrapper.findAll('.completion-btn')[2].trigger('click');
    await wrapper.vm.$nextTick();

    const section = wrapper.findComponent(TaskListSection);
    expect(section.props('tasks').map(t => t.id)).toEqual([1, 2, 3]);
  });

  it('вкладка «Архив» содержит только выполненные задачи', async () => {
    const wrapper = await mountPage();

    wrapper.findAll('.tab-btn')[6].trigger('click');
    await wrapper.vm.$nextTick();

    const section = wrapper.findComponent(TaskListSection);
    expect(section.props('tasks').map(t => t.id)).toEqual([2]);
  });

  it('переключение вкладок не перезапрашивает задачи', async () => {
    const wrapper = await mountPage();

    wrapper.findAll('.tab-btn')[6].trigger('click');
    wrapper.findAll('.tab-btn')[2].trigger('click');
    await wrapper.vm.$nextTick();

    expect(getTasks).toHaveBeenCalledTimes(1);
  });

  it('вкладка «Все задачи» получает дефолт «Без проекта» и сортировку', async () => {
    const wrapper = await mountPage();

    wrapper.findAll('.tab-btn')[2].trigger('click');
    await wrapper.vm.$nextTick();

    const section = wrapper.findComponent(TaskListSection);
    expect(section.props('defaultFilterProject')).toBe(NO_PROJECT_FILTER);
    expect(section.props('showSort')).toBe(true);
  });

  it('вкладка «Архив» без дефолта фильтра и без сортировки', async () => {
    const wrapper = await mountPage();

    wrapper.findAll('.tab-btn')[6].trigger('click');
    await wrapper.vm.$nextTick();

    const section = wrapper.findComponent(TaskListSection);
    expect(section.props('defaultFilterProject')).toBe('');
    expect(section.props('showSort')).toBe(false);
  });

  it('загружает идеи и отдаёт их на вкладку «Идеи»', async () => {
    getAllIdeas.mockResolvedValue({
      isSuccess: true,
      data: [{ id: 1, name: 'Идея А', description: 'Текст' }]
    });
    const wrapper = await mountPage();

    expect(getAllIdeas).toHaveBeenCalledTimes(1);

    wrapper.findAll('.tab-btn')[3].trigger('click');
    await wrapper.vm.$nextTick();

    const panel = wrapper.findComponent(IdeasPanel);
    expect(panel.props('ideas').map(i => i.id)).toEqual([1]);
  });

  it('вкладка «Напоминания» рендерит панель напоминаний', async () => {
    const wrapper = await mountPage();

    wrapper.findAll('.tab-btn')[4].trigger('click');
    await wrapper.vm.$nextTick();

    expect(wrapper.findComponent(RemindersPanel).exists()).toBe(true);
  });

  it('вкладка «Календарь» рендерит панель календаря', async () => {
    const wrapper = await mountPage();

    wrapper.findAll('.tab-btn')[5].trigger('click');
    await wrapper.vm.$nextTick();

    expect(wrapper.findComponent(CalendarPanel).exists()).toBe(true);
  });
});
