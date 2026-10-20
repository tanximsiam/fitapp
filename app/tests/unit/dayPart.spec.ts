import { describe, expect, it } from 'vitest'
import { dayPart } from '@/lib/dayPart'

const at = (h: number, m = 0) => new Date(2026, 9, 20, h, m)

describe('dayPart', () => {
  it('splits the day at 5, 12, 17 and 22', () => {
    expect([at(4, 59), at(5), at(11, 59), at(12), at(16, 59), at(17), at(21, 59), at(22)].map((d) => dayPart(d).key)).toEqual([
      'night', 'morning', 'morning', 'afternoon', 'afternoon', 'evening', 'evening', 'night',
    ])
  })

  it('starts the night at 22:00, yesterday when it is past midnight', () => {
    expect(dayPart(at(23)).start).toEqual(new Date(2026, 9, 20, 22))
    expect(dayPart(at(2)).start).toEqual(new Date(2026, 9, 19, 22))
  })
})
