import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import DateField from '../DateField.vue';

function mountField(props = {}) {
  return mount(DateField, { props: { modelValue: '', ...props } });
}

describe('DateField', () => {
  it('показывает ISO-дату в формате дд.мм.гггг', () => {
    const wrapper = mountField({ modelValue: '2026-10-05' });
    expect(wrapper.find('.date-field-input').element.value).toBe('05.10.2026');
  });

  it('пустая дата отображается пустой строкой', () => {
    const wrapper = mountField();
    expect(wrapper.find('.date-field-input').element.value).toBe('');
  });

  it('ввод цифр маскируется и отдаёт ISO', async () => {
    const wrapper = mountField();
    const input = wrapper.find('.date-field-input');
    await input.setValue('05102026');

    expect(input.element.value).toBe('05.10.2026');
    expect(wrapper.emitted('update:modelValue').at(-1)).toEqual(['2026-10-05']);
  });

  it('неполная дата отдаёт пустое значение', async () => {
    const wrapper = mountField();
    await wrapper.find('.date-field-input').setValue('05.10');
    expect(wrapper.emitted('update:modelValue').at(-1)).toEqual(['']);
  });

  it('выбор в нативном date-инпуте отдаёт ISO', async () => {
    const wrapper = mountField();
    await wrapper.find('.date-field-native').setValue('2026-12-31');

    expect(wrapper.emitted('update:modelValue').at(-1)).toEqual(['2026-12-31']);
    expect(wrapper.find('.date-field-input').element.value).toBe('31.12.2026');
  });

  it('кнопка очистки сбрасывает дату', async () => {
    const wrapper = mountField({ modelValue: '2026-10-05' });
    await wrapper.find('.date-field-clear').trigger('click');

    expect(wrapper.emitted('update:modelValue').at(-1)).toEqual(['']);
    expect(wrapper.find('.date-field-input').element.value).toBe('');
  });

  it('передаёт max в нативный date-инпут', () => {
    const wrapper = mountField({ max: '2026-10-10' });
    expect(wrapper.find('.date-field-native').attributes('max')).toBe('2026-10-10');
  });

  it('без max нативный date-инпут без ограничения', () => {
    const wrapper = mountField();
    expect(wrapper.find('.date-field-native').attributes('max')).toBeUndefined();
  });

  it('невалидное значение при blur откатывается к последнему валидному', async () => {
    const wrapper = mountField({ modelValue: '2026-10-05' });
    const input = wrapper.find('.date-field-input');
    await input.setValue('99.99.9999');
    await input.trigger('blur');

    expect(input.element.value).toBe('05.10.2026');
  });
});
