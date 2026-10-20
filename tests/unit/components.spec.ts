import { describe, expect, test } from 'vitest'
import { mount } from '@vue/test-utils'
import BarChart from '@/components/charts/BarChart.vue'
import MonthCalendar from '@/components/MonthCalendar.vue'
import GoalMeter from '@/components/GoalMeter.vue'
import { metricBars } from '@/data/chartData'
import type { DaySummary } from '@/types/fitness'

// jsdom has no layout; charts fall back to a fixed width.
globalThis.ResizeObserver ??= class {
  observe() {}
  disconnect() {}
} as unknown as typeof ResizeObserver

const day = (date: string, steps: number | null): DaySummary => ({
  date,
  activity: steps === null ? null : { steps, distanceM: null, activeKcal: null, activeMinutes: null, source: 'x' },
  sleep: null,
  heartRate: null,
  workouts: [],
})

describe('BarChart', () => {
  const bars = metricBars([day('2026-10-01', 4000), day('2026-10-02', null), day('2026-10-03', 9000)], (d) => d.activity?.steps, 'blue', String)

  test('draws missing days as placeholders, not zero-height bars', () => {
    const wrapper = mount(BarChart, { props: { bars, description: 'Steps', valueName: 'Steps' } })
    expect(wrapper.findAll('path[fill="blue"]')).toHaveLength(2)
    expect(wrapper.findAll('rect[stroke-dasharray]')).toHaveLength(1)
    expect(wrapper.find('tbody').text()).toContain('No data')
  })

  test('keyboard selects a day', async () => {
    const wrapper = mount(BarChart, { props: { bars, description: 'Steps', valueName: 'Steps' } })
    const svg = wrapper.find('svg')
    await svg.trigger('keydown', { key: 'ArrowLeft' })
    await svg.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('select')?.[0]).toEqual(['2026-10-02'])
  })
})

describe('MonthCalendar', () => {
  const mountAt = (modelValue: string) =>
    mount(MonthCalendar, { props: { modelValue, today: '2026-10-18', hasData: (d: string) => d !== '2026-10-14' } })

  test('shows the whole month, disables future days and the next month', () => {
    const wrapper = mountAt('2026-10-18')
    expect(wrapper.findAll('[data-date]')).toHaveLength(31)
    expect(wrapper.find('[data-date="2026-10-19"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('[data-date="2026-10-18"]').attributes('disabled')).toBeUndefined()
    expect(wrapper.find('[aria-label="Next month"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('[data-date="2026-10-14"]').attributes('aria-label')).toContain('no watch data')
  })

  test('selecting a day and keyboard moves emit dates; paging shows the previous month', async () => {
    const wrapper = mountAt('2026-10-18')
    await wrapper.find('[data-date="2026-10-15"]').trigger('click')
    await wrapper.find('[role="group"]').trigger('keydown', { key: 'ArrowUp' })
    await wrapper.find('[role="group"]').trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.emitted('update:modelValue')).toEqual([['2026-10-15'], ['2026-10-11']])
    await wrapper.find('[aria-label="Previous month"]').trigger('click')
    expect(wrapper.find('[data-date="2026-09-30"]').exists()).toBe(true)
  })
})

describe('GoalMeter', () => {
  test('shows "Not measured" instead of 0% when the value is missing', () => {
    const wrapper = mount(GoalMeter, { props: { label: 'Steps', valueText: '—', goalText: '8,000', ratio: null, color: 'blue' } })
    expect(wrapper.text()).toContain('Not measured')
    expect(wrapper.find('[role="meter"]').attributes('aria-valuenow')).toBeUndefined()
  })
})
