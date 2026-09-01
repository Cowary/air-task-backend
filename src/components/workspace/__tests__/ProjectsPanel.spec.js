import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import ProjectsPanel from '../ProjectsPanel.vue';
import { ACTIVE_PROJECT_STATUSES, ALL_PROJECT_STATUSES } from '../../../api/projects.js';

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
