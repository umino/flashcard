// =====================================================
// 出題キュー生成
// =====================================================
import type { Card, ReviewState, StudyMode } from './types'

/** 出題キューを生成する純関数 */
export function buildQueue(
  cards: Card[],
  reviews: Map<string, ReviewState>,
  mode: StudyMode,
  lang?: 'es' | 'zh',
  now = Date.now(),
): Card[] {
  // 言語フィルタ
  const filtered = lang ? cards.filter(c => c.lang === lang) : cards

  if (mode === 'lapses') {
    // 間違えた単語のみ（lapses > 0 のカード）を lapses 降順
    return filtered
      .filter(c => {
        const r = reviews.get(c.id)
        return r !== undefined && r.lapses > 0
      })
      .sort((a, b) => {
        const ra = reviews.get(a.id)!
        const rb = reviews.get(b.id)!
        return rb.lapses - ra.lapses
      })
  }

  if (mode === 'all') {
    // 全カードを lapses 降順 → dueDate 昇順
    return filtered.sort((a, b) => {
      const ra = reviews.get(a.id)
      const rb = reviews.get(b.id)
      const lapsesA = ra?.lapses ?? 0
      const lapsesB = rb?.lapses ?? 0
      if (lapsesB !== lapsesA) return lapsesB - lapsesA
      return (ra?.dueDate ?? 0) - (rb?.dueDate ?? 0)
    })
  }

  // mode === 'due': 期限切れカードを優先（dueDate ≤ now）
  // 1. dueDate が今以前のもの → lapses 多い順 → dueDate 古い順
  // 2. 新規（review なし）→ createdAt 昇順
  const due: Card[] = []
  const fresh: Card[] = []

  for (const card of filtered) {
    const r = reviews.get(card.id)
    if (r === undefined) {
      fresh.push(card)
    } else if (r.dueDate <= now) {
      due.push(card)
    }
  }

  due.sort((a, b) => {
    const ra = reviews.get(a.id)!
    const rb = reviews.get(b.id)!
    if (rb.lapses !== ra.lapses) return rb.lapses - ra.lapses
    return ra.dueDate - rb.dueDate
  })

  fresh.sort((a, b) => a.createdAt - b.createdAt)

  return [...due, ...fresh]
}

/** 今日の期限切れ枚数を返す（ホーム画面の表示用） */
export function countDueToday(
  cards: Card[],
  reviews: Map<string, ReviewState>,
  lang?: 'es' | 'zh',
  now = Date.now(),
): number {
  const filtered = lang ? cards.filter(c => c.lang === lang) : cards
  return filtered.filter(c => {
    const r = reviews.get(c.id)
    return r === undefined || r.dueDate <= now
  }).length
}
