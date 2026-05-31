import { describe, it, expect } from 'vitest'
import { createInitialReview, updateReview, gradeToScore } from '../srs'

const NOW = 1_700_000_000_000  // 固定タイムスタンプ

describe('gradeToScore', () => {
  it('again → 1', () => expect(gradeToScore('again')).toBe(1))
  it('hard → 2',  () => expect(gradeToScore('hard')).toBe(2))
  it('good → 4',  () => expect(gradeToScore('good')).toBe(4))
  it('easy → 5',  () => expect(gradeToScore('easy')).toBe(5))
})

describe('createInitialReview', () => {
  it('初期状態のプロパティが正しい', () => {
    const r = createInitialReview('card-1', NOW)
    expect(r.cardId).toBe('card-1')
    expect(r.repetitions).toBe(0)
    expect(r.easeFactor).toBeCloseTo(2.5)
    expect(r.intervalDays).toBe(0)
    expect(r.dueDate).toBe(NOW)
    expect(r.lapses).toBe(0)
  })
})

describe('updateReview: 正解系', () => {
  it('初回 Good → interval=1日', () => {
    const r = createInitialReview('c', NOW)
    const next = updateReview(r, 'good', NOW)
    expect(next.repetitions).toBe(1)
    expect(next.intervalDays).toBe(1)
    expect(next.lapses).toBe(0)
  })

  it('2回目 Good → interval=6日', () => {
    const r = { ...createInitialReview('c', NOW), repetitions: 1, intervalDays: 1 }
    const next = updateReview(r, 'good', NOW)
    expect(next.repetitions).toBe(2)
    expect(next.intervalDays).toBe(6)
  })

  it('3回目 Good → interval = round(6 * easeFactor)', () => {
    const r = { ...createInitialReview('c', NOW), repetitions: 2, intervalDays: 6 }
    const next = updateReview(r, 'good', NOW)
    expect(next.intervalDays).toBe(Math.round(6 * r.easeFactor))
  })

  it('Easy は interval にボーナス倍率がかかる', () => {
    const r = { ...createInitialReview('c', NOW), repetitions: 2, intervalDays: 6 }
    const good = updateReview(r, 'good', NOW)
    const easy = updateReview(r, 'easy', NOW)
    expect(easy.intervalDays).toBeGreaterThan(good.intervalDays)
  })
})

describe('updateReview: 不正解系', () => {
  it('Again → lapses が増える', () => {
    const r = { ...createInitialReview('c', NOW), repetitions: 3, intervalDays: 10 }
    const next = updateReview(r, 'again', NOW)
    expect(next.lapses).toBe(1)
    expect(next.repetitions).toBe(0)
    expect(next.intervalDays).toBe(0)
  })

  it('Again → dueDate が 10分後', () => {
    const r = createInitialReview('c', NOW)
    const next = updateReview(r, 'again', NOW)
    expect(next.dueDate).toBe(NOW + 10 * 60 * 1000)
  })

  it('Hard → interval は短縮されるが lapses は増えない', () => {
    const r = { ...createInitialReview('c', NOW), repetitions: 2, intervalDays: 10 }
    const next = updateReview(r, 'hard', NOW)
    expect(next.lapses).toBe(0)
    expect(next.intervalDays).toBeLessThan(10)
  })
})

describe('easeFactor の下限', () => {
  it('Again を繰り返しても easeFactor は 1.3 未満にならない', () => {
    let r = createInitialReview('c', NOW)
    for (let i = 0; i < 20; i++) {
      r = updateReview(r, 'again', NOW + i * 1000)
    }
    expect(r.easeFactor).toBeGreaterThanOrEqual(1.3)
  })
})
