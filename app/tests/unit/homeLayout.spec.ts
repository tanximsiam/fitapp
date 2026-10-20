import { describe, expect, it } from 'vitest'
import { DEFAULT_LAYOUT, normalizeLayout } from '@/composables/useHomeLayout'

describe('normalizeLayout', () => {
  it('falls back to the default for missing or broken data', () => {
    expect(normalizeLayout(null)).toEqual(DEFAULT_LAYOUT)
    expect(normalizeLayout('nope')).toEqual(DEFAULT_LAYOUT)
  })

  it('keeps the saved order, drops unknown and duplicate ids, appends new cards', () => {
    const saved = [{ id: 'timeline', visible: false }, { id: 'old-card', visible: true }, { id: 'timeline', visible: true }, { id: 'goals', visible: true }]
    expect(normalizeLayout(saved).map((c) => `${c.id}:${c.visible}`)).toEqual(['timeline:false', 'goals:true', 'health:true', 'wellbeing:true'])
  })

  it("never hides today's health", () => {
    expect(normalizeLayout([{ id: 'health', visible: false }]).find((c) => c.id === 'health')?.visible).toBe(true)
  })
})
