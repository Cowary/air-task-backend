import { describe, it, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';

vi.mock('../../api/projects.js', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, getAllProjects: vi.fn(), createProject: vi.fn(), updateProject: vi.fn() };
});

import ProjectFormModal from '../ProjectFormModal.vue';
import ProjectModal from '../ProjectModal.vue';
import ProjectsPage from '../../views/ProjectsPage.vue';
import { getAllProjects } from '../../api/projects.js';

describe('Статус проекта «Завершён» (COMPLETED) убран из форм и фильтров', () => {
  it('в ProjectFormModal нет опции COMPLETED, дефолт — ACTIVE', () => {
    const wrapper = mount(ProjectFormModal, {
      props: { visible: true, project: null }
    });

    const values = wrapper.findAll('#projectStatus option').map(o => o.element.value);
    expect(values).not.toContain('COMPLETED');
    expect(values).toEqual(['ACTIVE', 'ARCHIVED']);
    expect(wrapper.vm.form.status).toBe('ACTIVE');
  });

  it('в ProjectModal нет опции COMPLETED', () => {
    const wrapper = mount(ProjectModal, {
      props: { visible: true, createProject: vi.fn(), onProjectCreated: vi.fn() }
    });

    const values = wrapper.findAll('#projectStatus option').map(o => o.element.value);
    expect(values).not.toContain('COMPLETED');
    expect(values).toEqual(['ACTIVE', 'ARCHIVED']);
  });

  it('фильтр статусов на ProjectsPage использует валидный DONE вместо COMPLETED', async () => {
    getAllProjects.mockResolvedValue({ isSuccess: true, data: { projects: [] } });

    const wrapper = mount(ProjectsPage, {
      global: {
        stubs: { RouterLink: { template: '<a><slot /></a>' }, ProjectFormModal: true, ProjectDetailModal: true }
      }
    });
    await flushPromises();

    const values = wrapper.findAll('#filterStatus option').map(o => o.element.value);
    expect(values).not.toContain('COMPLETED');
    expect(values).toContain('DONE');
  });
});
