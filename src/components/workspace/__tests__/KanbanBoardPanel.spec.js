import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';

vi.mock('../../../api/weeklyTasks.js', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, getAllWeeklyTasks: vi.fn() };
});

vi.mock('../../../api/reminders.js', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, getAllReminders: vi.fn() };
});

vi.mock('../../../api/settings.js', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, getAppSettings: vi.fn(), updateAppSettings: vi.fn() };
});

import { getAllWeeklyTasks } from '../../../api/weeklyTasks.js';
import { getAllReminders } from '../../../api/reminders.js';
import { getAppSettings } from '../../../api/settings.js';
import { resetSettings } from '../../../store/settings.js';
import KanbanBoardPanel from '../KanbanBoardPanel.vue';

const TODAY = '2026-09-23'; // среда
const WEEK_START = '2026-09-20'; // воскресенье
const WEEK_END = '2026-09-26'; // суббота
const MONTH_END = '2026-09-30';

function task(id, dueDate, extra = {}) {
  return {
    id,
    name: `Задача ${id}`,
    priority: 'LOW',
    isComplete: false,
    project: { name: 'Проект А' },
    description: '',
    createdTs: '2026-09-01T10:00:00',
    subTasks: [],
    dueDate,
    ...extra
  };
}

async function mountPanel(props = {}) {
  const wrapper = mount(KanbanBoardPanel, {
    props: { tasks: [], projects: [], ...props },
    global: {
      stubs: {
        TaskFormModal: true,
        WeeklyTaskFormModal: true,
        ReminderFormModal: true
      }
    }
  });
  await flushPromises();
  return wrapper;
}

function cardsInColumn(wrapper, key) {
  return wrapper.findAll(`.column-${key} .kanban-card`);
}

function titlesInColumn(wrapper, key) {
  return cardsInColumn(wrapper, key).map(card => card.find('.card-title').text());
}

describe('KanbanBoardPanel — распределение по колонкам', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(`${TODAY}T12:00:00`));
    resetSettings();
    getAppSettings.mockResolvedValue({ isSuccess: true, data: { firstDayOfWeek: 'SUNDAY' } });
    getAllWeeklyTasks.mockResolvedValue({ isSuccess: true, data: [] });
    getAllReminders.mockResolvedValue({ isSuccess: true, data: [] });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('показывает диапазон текущей недели «с … по …»', async () => {
    const wrapper = await mountPanel();

    expect(wrapper.find('.week-range-dates').text()).toBe('с 20.09.2026 по 26.09.2026');
  });

  it('отображает колонки в заданном порядке', async () => {
    const wrapper = await mountPanel();
    const titles = wrapper.findAll('.column-title').map(node => node.text());

    expect(titles).toEqual(['Просрочено', 'Сегодня', 'На этой неделе', 'В этом месяце']);
  });

  it('раскладывает задачи по колонкам по дате', async () => {
    const wrapper = await mountPanel({
      tasks: [
        task(1, '2026-09-20'), // просрочено
        task(2, TODAY), // сегодня
        task(3, '2026-09-25'), // эта неделя
        task(4, '2026-09-29') // этот месяц
      ]
    });

    expect(titlesInColumn(wrapper, 'overdue')).toEqual(['Задача 1']);
    expect(titlesInColumn(wrapper, 'today')).toEqual(['Задача 2']);
    expect(titlesInColumn(wrapper, 'week')).toEqual(['Задача 3']);
    expect(titlesInColumn(wrapper, 'month')).toEqual(['Задача 4']);
  });

  it('не показывает задачи за пределами текущего месяца', async () => {
    const wrapper = await mountPanel({ tasks: [task(1, '2026-10-05')] });

    expect(wrapper.findAll('.kanban-card')).toHaveLength(0);
  });

  it('исключает выполненные задачи и задачи без даты', async () => {
    const wrapper = await mountPanel({
      tasks: [task(1, TODAY, { isComplete: true }), task(2, null)]
    });

    expect(wrapper.findAll('.kanban-card')).toHaveLength(0);
  });
});

describe('KanbanBoardPanel — типы карточек и цвета', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(`${TODAY}T12:00:00`));
    resetSettings();
    getAppSettings.mockResolvedValue({ isSuccess: true, data: { firstDayOfWeek: 'SUNDAY' } });
    getAllWeeklyTasks.mockResolvedValue({ isSuccess: true, data: [] });
    getAllReminders.mockResolvedValue({ isSuccess: true, data: [] });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('различает задачу проекта и задачу без проекта', async () => {
    const wrapper = await mountPanel({
      tasks: [
        task(1, TODAY, { project: { name: 'Проект А' } }),
        task(2, TODAY, { project: { name: 'Без проекта' } }),
        task(3, TODAY, { project: null })
      ]
    });

    expect(wrapper.findAll('.card-project-task')).toHaveLength(1);
    expect(wrapper.findAll('.card-plain-task')).toHaveLength(2);
  });

  it('weekly-задача получает дату окончания недели и класс card-weekly', async () => {
    getAllWeeklyTasks.mockResolvedValue({
      isSuccess: true,
      data: [{ id: 7, name: 'Обзор недели', count: 1, project: { name: 'Проект А' }, priority: 'MIDDLE', status: 'IN_PROGRESS' }]
    });

    const wrapper = await mountPanel();
    const card = wrapper.find('.card-weekly');

    expect(card.exists()).toBe(true);
    expect(card.find('.card-title').text()).toBe('Обзор недели');
    expect(card.find('.card-date').text()).toContain(WEEK_END.split('-').reverse().join('.'));
    expect(titlesInColumn(wrapper, 'week')).toContain('Обзор недели');
  });

  it('напоминание использует nextDueDate и класс card-reminder', async () => {
    getAllReminders.mockResolvedValue({
      isSuccess: true,
      data: [{ id: 3, name: 'Заменить масло', nextDueDate: TODAY, deleted: false, resolved: false }]
    });

    const wrapper = await mountPanel();
    const card = wrapper.find('.card-reminder');

    expect(card.exists()).toBe(true);
    expect(titlesInColumn(wrapper, 'today')).toContain('Заменить масло');
  });

  it('исключает удалённые и завершённые напоминания', async () => {
    getAllReminders.mockResolvedValue({
      isSuccess: true,
      data: [
        { id: 1, name: 'Удалено', nextDueDate: TODAY, deleted: true, resolved: false },
        { id: 2, name: 'Resolved', nextDueDate: TODAY, deleted: false, resolved: true }
      ]
    });

    const wrapper = await mountPanel();

    expect(wrapper.findAll('.kanban-card')).toHaveLength(0);
  });
});

describe('KanbanBoardPanel — взаимодействие', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(`${TODAY}T12:00:00`));
    resetSettings();
    getAppSettings.mockResolvedValue({ isSuccess: true, data: { firstDayOfWeek: 'SUNDAY' } });
    getAllWeeklyTasks.mockResolvedValue({ isSuccess: true, data: [] });
    getAllReminders.mockResolvedValue({ isSuccess: true, data: [] });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('клик по задаче открывает модалку редактирования', async () => {
    const wrapper = await mountPanel({ tasks: [task(1, TODAY)] });

    await wrapper.find('.card-button').trigger('click');

    const modal = wrapper.findComponent({ name: 'TaskFormModal' });
    expect(modal.props('visible')).toBe(true);
  });

  it('ошибка загрузки weekly/reminders показывает блок с повтором', async () => {
    getAllWeeklyTasks.mockResolvedValue({ isSuccess: false, errorMessage: 'boom' });

    const wrapper = await mountPanel();

    expect(wrapper.find('.error-block').exists()).toBe(true);
  });
});
