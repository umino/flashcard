import { describe, it, expect } from 'vitest'
import { recordReview, calcStreak, createEmptyStats, todayProgress } from '../stats'

const NOW = new Date('2024-01-15T10:00:00Z').getTime()

describe('recordReview', () => {
  it('正解で reviewed と correct が増える', () => {
    const stats = createEmptyStats()
    const next = recordReview(stats, true, NOW)
    const today = next.daily['2024-01-15']
    expect(today.reviewed).toBe(1)
    expect(today.correct).toBe(1)
  })

  it('不正解で reviewed は増えるが correct は増えない', () => {
    const stats = createEmptyStats()
    const next = recordReview(stats, false, NOW)
    const today = next.daily['2024-01-15']
    expect(today.reviewed).toBe(1)
    expect(today.correct).toBe(0)
  })

  it('複数回記録が累積される', () => {
    let stats = createEmptyStats()
    stats = recordReview(stats, true, NOW)
    stats = recordReview(stats, true, NOW)
    stats = recordReview(stats, false, NOW)
    const today = stats.daily['2024-01-15']
    expect(today.reviewed).toBe(3)
    expect(today.correct).toBe(2)
  })
})

describe('calcStreak', () => {
  it('今日だけ学習 → 1', () => {
    let stats = createEmptyStats()
    stats = recordReview(stats, true, NOW)
    expect(stats.streakDays).toBe(1)
  })

  it('昨日と今日両方学習 → 2', () => {
    const yesterday = NOW - 24 * 60 * 60 * 1000
    let stats = createEmptyStats()
    stats = recordReview(stats, true, yesterday)
    stats = recordReview(stats, true, NOW)
    expect(calcStreak(stats, NOW)).toBe(2)
  })

  it('2日前と今日（昨日空白）→ 1（連続ではない）', () => {
    const twoDaysAgo = NOW - 2 * 24 * 60 * 60 * 1000
    let stats = createEmptyStats()
    stats = recordReview(stats, true, twoDaysAgo)
    stats = recordReview(stats, true, NOW)
    expect(calcStreak(stats, NOW)).toBe(1)
  })
})

describe('todayProgress', () => {
  it('goal 未達なら rate < 1', () => {
    let stats = createEmptyStats()
    stats = recordReview(stats, true, NOW)
    const p = todayProgress(stats, 10, NOW)
    expect(p.reviewed).toBe(1)
    expect(p.goal).toBe(10)
    expect(p.rate).toBeCloseTo(0.1)
  })

  it('goal 達成で rate = 1', () => {
    let stats = createEmptyStats()
    for (let i = 0; i < 20; i++) stats = recordReview(stats, true, NOW)
    const p = todayProgress(stats, 20, NOW)
    expect(p.rate).toBe(1)
  })
})
