import { describe, expect, test } from 'vitest'
import { mount } from '@vue/test-utils'
import BarChart from '@/components/charts/BarChart.vue'
import CalendarComp from '@/components/CalendarComp.vue'
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

describe('CalendarComp', () => {
  const mountAt = (modelValue: string) =>
    mount(CalendarComp, { props: { modelValue, today: '2026-10-18', hasData: (d: string) => d !== '2026-10-14' } })

  test('never offers future dates and ends the current week at today', () => {
    const wrapper = mountAt('2026-10-18')
    const days = wrapper.findAll('[data-date]').map((b) => b.attributes('data-date'))
    expect(days).toEqual(['2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17', '2026-10-18'])
    expect(wrapper.find('[aria-label="Next week"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('[data-date="2026-10-14"]').attributes('aria-label')).toContain('no data')
  })

  test('selecting and paging emit dates', async () => {
    const wrapper = mountAt('2026-10-18')
    await wrapper.find('[data-date="2026-10-15"]').trigger('click')
    await wrapper.find('[aria-label="Previous week"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['2026-10-15'], ['2026-10-11']])
  })
})

describe('GoalMeter', () => {
  test('shows "Not measured" instead of 0% when the value is missing', () => {
    const wrapper = mount(GoalMeter, { props: { label: 'Steps', valueText: '—', goalText: '8,000', ratio: null, color: 'blue' } })
    expect(wrapper.text()).toContain('Not measured')
    expect(wrapper.find('[role="meter"]').attributes('aria-valuenow')).toBeUndefined()
  })
})
