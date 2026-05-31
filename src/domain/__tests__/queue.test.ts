import { describe, it, expect } from 'vitest'
import { buildQueue, countDueToday } from '../queue'
import type { Card, ReviewState } from '../types'

const NOW = 1_700_000_000_000

function makeCard(id: string, lang: 'es' | 'zh' = 'es'): Card {
  return { id, lang, term: id, meaning: 'test', createdAt: NOW, updatedAt: NOW }
}

function makeReview(cardId: string, dueDate: number, lapses = 0): ReviewState {
  return { cardId, repetitions: 1, easeFactor: 2.5, intervalDays: 1, dueDate, lapses, lastReviewedAt: NOW - 10000 }
}

describe('buildQueue: due モード', () => {
  it('期限切れカードが新規カードより前に来る', () => {
    const cards = [makeCard('new'), makeCard('due')]
    const reviews = new Map([
      ['due', makeReview('due', NOW - 1000)],  // 期限切れ
    ])
    const queue = buildQueue(cards, reviews, 'due', undefined, NOW)
    expect(queue[0].id).toBe('due')
    expect(queue[1].id).toBe('new')
  })

  it('lapses が多いカードが先に来る（同じ期限切れ内で）', () => {
    const cards = [makeCard('low'), makeCard('high')]
    const reviews = new Map([
      ['low',  makeReview('low',  NOW - 1000, 1)],
      ['high', makeReview('high', NOW - 1000, 3)],
    ])
    const queue = buildQueue(cards, reviews, 'due', undefined, NOW)
    expect(queue[0].id).toBe('high')
  })

  it('言語フィルタが機能する', () => {
    const cards = [makeCard('es', 'es'), makeCard('zh', 'zh')]
    const reviews = new Map<string, ReviewState>()
    const queue = buildQueue(cards, reviews, 'due', 'es', NOW)
    expect(queue.every(c => c.lang === 'es')).toBe(true)
  })
})

describe('buildQueue: lapses モード', () => {
  it('lapses=0 のカードは含まれない', () => {
    const cards = [makeCard('ok'), makeCard('err')]
    const reviews = new Map([
      ['ok',  makeReview('ok',  NOW, 0)],
      ['err', makeReview('err', NOW, 2)],
    ])
    const queue = buildQueue(cards, reviews, 'lapses', undefined, NOW)
    expect(queue.map(c => c.id)).not.toContain('ok')
    expect(queue.map(c => c.id)).toContain('err')
  })
})

describe('countDueToday', () => {
  it('期限切れ + 新規の合計を返す', () => {
    const cards = [makeCard('a'), makeCard('b'), makeCard('c')]
    const reviews = new Map([
      ['a', makeReview('a', NOW - 1000)],  // 期限切れ
      ['b', makeReview('b', NOW + 99999)], // 未来（スキップ）
    ])
    expect(countDueToday(cards, reviews, undefined, NOW)).toBe(2) // a + c(新規)
  })
})
