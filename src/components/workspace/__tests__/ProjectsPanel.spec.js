import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';

vi.mock('../../../api/projects.js', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, updateProject: vi.fn() };
});

import ProjectsPanel from '../ProjectsPanel.vue';
import TaskListSection from '../TaskListSection.vue';
import { ACTIVE_PROJECT_STATUSES, ALL_PROJECT_STATUSES, updateProject } from '../../../api/projects.js';

const projects = [
  { id: 1, name: 'Активный проект', status: 'ACTIVE', priority: 'LOW', goalList: [], weeklyList: [], taskList: [] },
  { id: 2, name: 'Архивный проект', status: 'ARCHIVED', priority: 'HIGH', goalList: [], weeklyList: [], taskList: [] }
];

function mountPanel() {
  return mount(ProjectsPanel, {
    props: {
      projects,
      tasks: [],
      weekMap: {}
    },
    global: {
      stubs: {
        ProjectFormModal: true,
        TaskListSection: true,
        WeeklyTaskFormModal: true
      }
    }
  });
}

describe('ProjectsPanel — серверный фильтр статусов', () => {
  it('по умолчанию выбран режим «Активные»', () => {
    const wrapper = mountPanel();
    const statusSelect = wrapper.findAll('.filter-select')[0];

    expect(statusSelect.element.value).toBe('ACTIVE');
  });

  it.each([
    ['ACTIVE', ACTIVE_PROJECT_STATUSES],
    ['ALL', ALL_PROJECT_STATUSES],
    ['DONE', ['DONE']],
    ['ARCHIVED', ['ARCHIVED']]
  ])('при выборе %s эмитит statuses-changed с %j', async (option, expectedStatuses) => {
    const wrapper = mountPanel();
    const statusSelect = wrapper.findAll('.filter-select')[0];

    await statusSelect.setValue(option);

    const emitted = wrapper.emitted('statuses-changed');
    expect(emitted).toHaveLength(1);
    expect(emitted[0][0]).toEqual(expectedStatuses);
  });

  it('не фильтрует проекты по статусу на клиенте — список решает сервер', () => {
    const wrapper = mountPanel();
    const cards = wrapper.findAll('.project-card');

    expect(cards).toHaveLength(2);
    expect(cards.map(card => card.find('.card-name').text())).toEqual([
      'Активный проект',
      'Архивный проект'
    ]);
  });
});

describe('ProjectsPanel — только невыполненные задачи', () => {
  const panelTasks = [
    { id: 10, name: 'В работе', priority: 'LOW', isComplete: false, project: { id: 1, name: 'Активный проект' } },
    { id: 11, name: 'Готово', priority: 'LOW', isComplete: true, project: { id: 1, name: 'Активный проект' } },
    { id: 12, name: 'Висяк', priority: 'LOW', isComplete: false, project: null },
    { id: 13, name: 'Висяк готов', priority: 'LOW', isComplete: true, project: null }
  ];

  const panelProjects = [
    {
      id: 1,
      name: 'Активный проект',
      status: 'ACTIVE',
      priority: 'LOW',
      goalList: [],
      weeklyList: [],
      taskList: [
        { id: 10, name: 'В работе', isComplete: false },
        { id: 11, name: 'Готово', isComplete: true }
      ]
    }
  ];

  function mountWithTasks() {
    return mount(ProjectsPanel, {
      props: {
        projects: panelProjects,
        tasks: panelTasks,
        weekMap: {}
      },
      global: {
        stubs: {
          ProjectFormModal: true,
          TaskListSection: true,
          WeeklyTaskFormModal: true
        }
      }
    });
  }

  it('в панели проекта показываются только невыполненные задачи', async () => {
    const wrapper = mountWithTasks();
    wrapper.vm.select(1);
    await wrapper.vm.$nextTick();

    const section = wrapper.findComponent(TaskListSection);
    expect(section.props('tasks').map(task => task.id)).toEqual([10]);
  });

  it('в группе «Без проекта» показываются только невыполненные задачи', async () => {
    const wrapper = mountWithTasks();
    wrapper.vm.select('__none__');
    await wrapper.vm.$nextTick();

    const section = wrapper.findComponent(TaskListSection);
    expect(section.props('tasks').map(task => task.id)).toEqual([12]);
  });

  it('счётчик задач на карточке проекта считает только невыполненные', () => {
    const wrapper = mountWithTasks();
    const counters = wrapper.findAll('.counter-tasks');

    expect(counters[0].text()).toContain('1');
  });
});

describe('ProjectsPanel — подвкладки «Актуальные | Архив» в секции Задачи', () => {
  const panelTasks = [
    { id: 10, name: 'Актуальная', priority: 'LOW', isComplete: false, project: { id: 1, name: 'Активный проект' } },
    { id: 11, name: 'Архивная', priority: 'LOW', isComplete: true, project: { id: 1, name: 'Активный проект' } },
    { id: 12, name: 'Чужая активная', priority: 'LOW', isComplete: false, project: { id: 2, name: 'Другой проект' } },
    { id: 13, name: 'Висяк готов', priority: 'LOW', isComplete: true, project: null },
    { id: 14, name: 'Висяк актив', priority: 'LOW', isComplete: false, project: null }
  ];

  const panelProjects = [
    { id: 1, name: 'Активный проект', status: 'ACTIVE', priority: 'LOW', goalList: [], weeklyList: [], taskList: [] },
    { id: 2, name: 'Другой проект', status: 'ACTIVE', priority: 'LOW', goalList: [], weeklyList: [], taskList: [] }
  ];

  function mountPanel() {
    return mount(ProjectsPanel, {
      props: { projects: panelProjects, tasks: panelTasks, weekMap: {} },
      global: {
        stubs: {
          ProjectFormModal: true,
          TaskListSection: true,
          WeeklyTaskFormModal: true
        }
      }
    });
  }

  async function selectProjectAndOpenArchive(wrapper, key) {
    wrapper.vm.select(key);
    await wrapper.vm.$nextTick();
    await wrapper.findAll('.tasks-subtab')[1].trigger('click');
    await wrapper.vm.$nextTick();
  }

  it('подвкладки показывают счётчики активных и выполненных задач проекта', async () => {
    const wrapper = mountPanel();
    wrapper.vm.select(1);
    await wrapper.vm.$nextTick();

    const tabs = wrapper.findAll('.tasks-subtab');
    expect(tabs[0].text()).toContain('Актуальные');
    expect(tabs[0].text()).toContain('1');
    expect(tabs[1].text()).toContain('Архив');
    expect(tabs[1].text()).toContain('1');
  });

  it('по умолчанию активна подвкладка «Актуальные»', async () => {
    const wrapper = mountPanel();
    wrapper.vm.select(1);
    await wrapper.vm.$nextTick();

    const section = wrapper.findComponent(TaskListSection);
    expect(section.props('tasks').map(task => task.id)).toEqual([10]);
    expect(wrapper.findAll('.tasks-subtab')[0].classes()).toContain('active');
  });

  it('переключение на «Архив» показывает только выполненные задачи проекта', async () => {
    const wrapper = mountPanel();
    await selectProjectAndOpenArchive(wrapper, 1);

    const section = wrapper.findComponent(TaskListSection);
    expect(section.props('tasks').map(task => task.id)).toEqual([11]);
    expect(wrapper.findAll('.tasks-subtab')[1].classes()).toContain('active');
  });

  it('в архиве «Без проекта» — только выполненные задачи без проекта', async () => {
    const wrapper = mountPanel();
    await selectProjectAndOpenArchive(wrapper, '__none__');

    const section = wrapper.findComponent(TaskListSection);
    expect(section.props('tasks').map(task => task.id)).toEqual([13]);
  });

  it('при выборе другого проекта подвкладка сбрасывается на «Актуальные»', async () => {
    const wrapper = mountPanel();
    await selectProjectAndOpenArchive(wrapper, 1);

    wrapper.vm.select('__none__');
    await wrapper.vm.$nextTick();

    const section = wrapper.findComponent(TaskListSection);
    expect(wrapper.vm.projectTasksTab).toBe('active');
    expect(section.props('tasks').map(task => task.id)).toEqual([14]);
  });

  it('карточка «Без проекта» видна, когда есть только выполненные висячие задачи', () => {
    const wrapper = mount(ProjectsPanel, {
      props: {
        projects: panelProjects,
        tasks: [{ id: 14, name: 'Только архив', priority: 'LOW', isComplete: true, project: null }],
        weekMap: {}
      },
      global: {
        stubs: { ProjectFormModal: true, TaskListSection: true, WeeklyTaskFormModal: true }
      }
    });

    expect(wrapper.find('.orphan-card').exists()).toBe(true);
  });
});

describe('ProjectsPanel — завершение и возврат проекта', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('alert', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const project = (status, extra = {}) => ({
    id: 1, name: 'П1', status, priority: 'LOW',
    goalList: [], weeklyList: [], taskList: [],
    ...extra
  });

  const openTask = { id: 10, name: 'T10', priority: 'LOW', isComplete: false, project: { id: 1, name: 'П1' } };
  const doneTask = { id: 11, name: 'T11', priority: 'LOW', isComplete: true, project: { id: 1, name: 'П1' } };

  async function mountSelected(projects, tasks = []) {
    const wrapper = mount(ProjectsPanel, {
      props: { projects, tasks, weekMap: {} },
      global: {
        stubs: { ProjectFormModal: true, TaskListSection: true, WeeklyTaskFormModal: true }
      }
    });
    wrapper.vm.select(1);
    await wrapper.vm.$nextTick();
    return wrapper;
  }

  it('есть незакрытая задача — «Завершить проект» заблокирован', async () => {
    const wrapper = await mountSelected([project('ACTIVE')], [doneTask, openTask]);
    const btn = wrapper.find('.status-toggle-btn');

    expect(btn.text()).toContain('Завершить проект');
    expect(btn.attributes('disabled')).toBeDefined();
  });

  it('есть невыполненная цель — заблокирован', async () => {
    const wrapper = await mountSelected(
      [project('ACTIVE', { goalList: [{ id: 1, name: 'G', isCompleted: false }] })]
    );

    expect(wrapper.find('.status-toggle-btn').attributes('disabled')).toBeDefined();
  });

  it('есть еженедельная задача не в DONE — заблокирован', async () => {
    const wrapper = await mountSelected(
      [project('IN_PROGRESS', { weeklyList: [{ id: 5, name: 'W', status: 'IN_PROGRESS', count: 1, priority: 'LOW' }] })]
    );
    const btn = wrapper.find('.status-toggle-btn');

    expect(btn.text()).toContain('Завершить проект');
    expect(btn.attributes('disabled')).toBeDefined();
  });

  it('пустой проект завершить можно', async () => {
    const wrapper = await mountSelected([project('ACTIVE')]);

    expect(wrapper.find('.status-toggle-btn').attributes('disabled')).toBeUndefined();
  });

  it('всё выполнено — кнопка активна, клик шлёт status DONE и включает фильтр «Завершённые»', async () => {
    updateProject.mockResolvedValue({ isSuccess: true, data: project('DONE') });
    const wrapper = await mountSelected(
      [project('ACTIVE', {
        goalList: [{ id: 1, name: 'G', isCompleted: true }],
        weeklyList: [{ id: 5, name: 'W', status: 'DONE', count: 1, priority: 'LOW' }]
      })],
      [doneTask]
    );

    await wrapper.find('.status-toggle-btn').trigger('click');
    await flushPromises();

    expect(updateProject).toHaveBeenCalledWith(1, { status: 'DONE' });
    expect(wrapper.emitted('statuses-changed')).toHaveLength(1);
    expect(wrapper.emitted('statuses-changed')[0][0]).toEqual(['DONE']);
  });

  it('для DONE-проекта показывается «Вернуть в работу», клик шлёт ACTIVE', async () => {
    updateProject.mockResolvedValue({ isSuccess: true, data: project('ACTIVE') });
    const wrapper = await mountSelected([project('DONE')]);
    const btn = wrapper.find('.status-toggle-btn');

    expect(btn.text()).toContain('Вернуть в работу');

    await btn.trigger('click');
    await flushPromises();

    expect(updateProject).toHaveBeenCalledWith(1, { status: 'ACTIVE' });
    expect(wrapper.emitted('statuses-changed')[0][0]).toEqual(ACTIVE_PROJECT_STATUSES);
  });

  it('для ARCHIVED-проекта кнопок смены статуса нет', async () => {
    const wrapper = await mountSelected([project('ARCHIVED')]);

    expect(wrapper.find('.status-toggle-btn').exists()).toBe(false);
  });

  it('при ошибке смены статуса — alert, фильтр не переключается', async () => {
    updateProject.mockResolvedValue({ isSuccess: false, errorMessage: 'нет' });
    const wrapper = await mountSelected([project('ACTIVE')]);

    await wrapper.find('.status-toggle-btn').trigger('click');
    await flushPromises();

    expect(globalThis.alert).toHaveBeenCalled();
    expect(wrapper.emitted('statuses-changed')).toBeUndefined();
  });
});
