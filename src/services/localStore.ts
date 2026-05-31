// =====================================================
// localStorage 永続化（フォールバック兼キャッシュ）
// =====================================================
import type { AppData } from '../domain/types'
import { createEmptyStats } from '../domain/stats'

const KEY = 'flashcard_v1'

export function loadLocal(): AppData {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyData()
    return JSON.parse(raw) as AppData
  } catch {
    return emptyData()
  }
}

export function saveLocal(data: AppData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch {
    // ストレージ容量超過等は無視
  }
}

export function emptyData(): AppData {
  return { cards: [], reviews: [], stats: createEmptyStats() }
}

/** updatedAt の新しい方を採用してカードをマージ */
export function mergeData(local: AppData, remote: AppData): AppData {
  const cardMap = new Map(local.cards.map(c => [c.id, c]))
  for (const rc of remote.cards) {
    const lc = cardMap.get(rc.id)
    if (!lc || rc.updatedAt > lc.updatedAt) {
      cardMap.set(rc.id, rc)
    }
  }

  const reviewMap = new Map(local.reviews.map(r => [r.cardId, r]))
  for (const rr of remote.reviews) {
    const lr = reviewMap.get(rr.cardId)
    if (!lr || (rr.lastReviewedAt ?? 0) > (lr.lastReviewedAt ?? 0)) {
      reviewMap.set(rr.cardId, rr)
    }
  }

  // Stats: 日次データは両方をマージ（reviewed の多い方を採用）
  const daily = { ...local.stats.daily }
  for (const [date, rStat] of Object.entries(remote.stats.daily)) {
    const lStat = daily[date]
    if (!lStat || rStat.reviewed > lStat.reviewed) {
      daily[date] = rStat
    }
  }

  return {
    cards: Array.from(cardMap.values()),
    reviews: Array.from(reviewMap.values()),
    stats: {
      daily,
      lastStudyDate: [local.stats.lastStudyDate, remote.stats.lastStudyDate]
        .filter(Boolean)
        .sort()
        .pop(),
      streakDays: Math.max(local.stats.streakDays, remote.stats.streakDays),
    },
  }
}
