// =====================================================
// 出題キュー生成
// =====================================================
import type { Card, ReviewState, StudyMode } from './types'

function shuffle<T>(arr: T[]): T[] {
  const result = arr.slice()
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

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
    // 間違えた単語のみ（lapses > 0 のカード）をシャッフルして返す
    return shuffle(
      filtered.filter(c => {
        const r = reviews.get(c.id)
        return r !== undefined && r.lapses > 0
      }),
    )
  }

  if (mode === 'all') {
    // 全カードをシャッフルして返す
    return shuffle(filtered.slice())
  }

  // mode === 'due': 期限切れカードを優先（dueDate ≤ now）
  // 1. dueDate が今以前のもの → シャッフル
  // 2. 新規（review なし）→ シャッフル
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

  return [...shuffle(due), ...shuffle(fresh)]
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
