import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';

vi.mock('../../../api/rewards.js', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, getRewards: vi.fn(), createReward: vi.fn(), deleteReward: vi.fn(), buyReward: vi.fn() };
});

vi.mock('../../../api/gamification.js', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, getTransactions: vi.fn(), getWallet: vi.fn() };
});

vi.mock('../../../api/purchases.js', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, getPurchases: vi.fn(), buyPurchase: vi.fn() };
});

vi.mock('../../../store/wallet.js', () => ({
  useWallet: () => ({ balance: 42, totalEarned: 100, totalSpent: 58, isLoading: false }),
  refreshWallet: vi.fn()
}));

import { getRewards, createReward, buyReward } from '../../../api/rewards.js';
import { getTransactions, getWallet } from '../../../api/gamification.js';
import { getPurchases } from '../../../api/purchases.js';
import RewardsPanel from '../RewardsPanel.vue';
import RewardFormModal from '../RewardFormModal.vue';

const reward = { id: 1, name: 'Шоколадка', description: 'На выбор', cost: 15, priority: 'MIDDLE' };
const purchase = {
  id: 2,
  name: 'Новый телефон',
  priority: 'HIGH',
  category: 'Электроника',
  isComplete: false,
  coinCost: 500
};
const transaction = {
  id: 3,
  amount: 10,
  sourceType: 'TASK',
  sourceId: 5,
  description: 'Отчёт',
  createdTs: '2026-09-22T10:30:00'
};

async function mountPanel() {
  getRewards.mockResolvedValue({ isSuccess: true, data: [reward] });
  getPurchases.mockResolvedValue({ isSuccess: true, data: [purchase] });
  getTransactions.mockResolvedValue({ isSuccess: true, data: [transaction] });
  getWallet.mockResolvedValue({ isSuccess: true, data: { balance: 42, totalEarned: 100, totalSpent: 58 } });

  const wrapper = mount(RewardsPanel, {
    global: {
      stubs: {
        RouterLink: { template: '<a><slot /></a>' },
        teleport: true
      }
    }
  });
  await flushPromises();
  return wrapper;
}

describe('RewardsPanel — модалка постоянной награды', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('alert', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('кнопка «Добавить» открывает модалку создания награды', async () => {
    const wrapper = await mountPanel();
    expect(wrapper.find('.modal-overlay').exists()).toBe(false);

    await wrapper.find('.create-btn').trigger('click');
    await flushPromises();

    expect(wrapper.findComponent(RewardFormModal).props('visible')).toBe(true);
    expect(wrapper.findComponent(RewardFormModal).props('reward')).toBeNull();
    expect(wrapper.find('.modal-overlay').exists()).toBe(true);
    expect(wrapper.find('.modal-content h3').text()).toBe('Создать награду');
  });

  it('кнопка «Редактировать» открывает модалку с данными награды', async () => {
    const wrapper = await mountPanel();

    await wrapper.find('.reward-card .icon-btn:not(.danger)').trigger('click');
    await flushPromises();

    expect(wrapper.findComponent(RewardFormModal).props('visible')).toBe(true);
    expect(wrapper.findComponent(RewardFormModal).props('reward')).toMatchObject({ id: 1, name: 'Шоколадка' });
    expect(wrapper.find('.modal-content h3').text()).toBe('Редактировать награду');
    expect(wrapper.find('#rewardName').element.value).toBe('Шоколадка');
  });

  it('сохранение награды вызывает createReward и закрывает модалку', async () => {
    const wrapper = await mountPanel();
    createReward.mockResolvedValue({
      isSuccess: true,
      data: { id: 9, name: 'Кофе', cost: 25, priority: 'HIGH' }
    });

    await wrapper.find('.create-btn').trigger('click');
    await flushPromises();

    await wrapper.find('#rewardName').setValue('Кофе');
    await wrapper.find('#rewardCost').setValue(25);
    await wrapper.find('#rewardPriority').setValue('HIGH');
    await wrapper.find('.reward-form').trigger('submit');
    await flushPromises();

    expect(createReward).toHaveBeenCalledWith({
      name: 'Кофе',
      description: null,
      cost: 25,
      priority: 'HIGH'
    });
    expect(wrapper.findComponent(RewardFormModal).props('visible')).toBe(false);
  });

  it('кнопка «Купить» списывает монеты через buyReward', async () => {
    const wrapper = await mountPanel();
    buyReward.mockResolvedValue({ isSuccess: true, data: reward });

    await wrapper.findAll('.buy-btn')[0].trigger('click');
    await flushPromises();

    expect(buyReward).toHaveBeenCalledWith(1);
  });
});
